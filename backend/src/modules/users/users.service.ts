import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt'; //Librería para hashear password
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';
import { UserStatus } from './enums/user-status.enum';
import { UserMembresia } from '../membresia/entities/userMembresia.entity';
import { EstadoUserMembresia } from '../membresia/entities/estadoUserMembresia.entity';
import { Membresia } from '../membresia/entities/membresia.entity';
import { Pago } from '../membresia/entities/pago.entity';
import { GimnasioService } from '../gimnasio/gimnasio.service';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User) // Inyecta el repositorio de TypeORM y permite hacer Querys
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserMembresia)
    private readonly userMembresiaRepository: Repository<UserMembresia>,
    @InjectRepository(EstadoUserMembresia)
    private readonly estadoUserMembresiaRepository: Repository<EstadoUserMembresia>,
    @InjectRepository(Membresia)
    private readonly membresiaRepository: Repository<Membresia>,
    @InjectRepository(Pago)
    private readonly pagoRepository: Repository<Pago>,
    private readonly gimnasioService: GimnasioService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // Valida que el gimnasio exista y este activo antes de crear la cuenta.
    await this.gimnasioService.findActiveById(createUserDto.gimnasioId);

    const normalizedEmail = createUserDto.email.trim().toLowerCase();

    // VALIDACIÓN PREVIA: Verificar si el email ya existe EN ESE GIMNASIO
    // (el mismo email puede existir en otro gimnasio, son cuentas distintas)
    const userExists = await this.userRepository.findOne({
      where: { gimnasioId: createUserDto.gimnasioId, email: normalizedEmail },
    });

    if (userExists) {
      throw new ConflictException('El correo electronico ya esta registrado en este gimnasio.');
    }

    // En desarrollo local usamos menos rondas para mejorar tiempos de respuesta.
    const defaultRounds = process.env.NODE_ENV === 'production' ? 10 : 8;
    const configuredRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? defaultRounds);
    const saltRounds = Number.isFinite(configuredRounds) && configuredRounds > 3
      ? configuredRounds
      : defaultRounds;

    //HASHEAR PASSWORD: NUNCA guardes contraseña en plano
    //bcrypt genera un hash + salt
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    //CREAR OBJETO USER para guardar en BD
    const newUser = this.userRepository.create({
      gimnasioId: createUserDto.gimnasioId,
      nombre: createUserDto.nombre,
      apellido: createUserDto.apellido,
      email: normalizedEmail,
      dni: createUserDto.dni,
      password_hash: hashedPassword, // Guardamos el HASH
      role: UserRole.CLIENTE,
      estado: UserStatus.CREADO,
      // membresias y planEntrenamiento se inicializan null/vacío automáticamente
    });

    //GUARDAR EN BASE DE DATOS
    // Try-catch como respaldo para race conditions en requests concurrentes
    let userSaved: User;
    try {
      userSaved = await this.userRepository.save(newUser);
    } catch (error) {
      // Maneja conflictos de unicidad en DB (ej. dos registros concurrentes con el mismo email)
      if (error instanceof QueryFailedError && (error as any).driverError?.code === '23505') {
        throw new ConflictException('El correo electronico ya esta registrado en este gimnasio.');
      }
      throw error;
    }

    //RESPUESTA: Devolver usuario SIN la password
    // Hacemos un objeto nuevo excluyendo password_hash
    return this.sanitizeUser(userSaved);
  }

  async findAll(gimnasioId: number) {
    const users = await this.userRepository.find({
      where: { gimnasioId },
      order: { id: 'ASC' },
    });

    return users.map((user) => this.sanitizeUser(user));
  }

  async findCreatedUsers(gimnasioId: number) {
    console.log('[UsersService.findCreatedUsers] Iniciando busqueda de usuarios pendientes', { gimnasioId });

    const users = await this.userRepository.find({
      where: { gimnasioId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        dni: true,
        role: true,
        estado: true,
      },
      order: { id: 'ASC' },
    });

    console.log(`[UsersService.findCreatedUsers] Usuarios leidos desde DB: ${users.length}`);

    const normalize = (value: unknown): string => String(value ?? '').trim().toLowerCase();

    const pendingUsers = users
      .filter((user) => {
        const normalizedRole = normalize(user.role);
        const normalizedEstado = normalize(user.estado);

        const isClient = normalizedRole === normalize(UserRole.CLIENTE);
        const isCreated = normalizedEstado === '' || normalizedEstado === normalize(UserStatus.CREADO);

        if (!isClient || !isCreated) {
          console.log('[UsersService.findCreatedUsers] Usuario descartado por filtro', {
            id: user.id,
            roleOriginal: user.role,
            estadoOriginal: user.estado,
            roleNormalizado: normalizedRole,
            estadoNormalizado: normalizedEstado,
            isClient,
            isCreated,
          });
        }

        return isClient && isCreated;
      })
      .map((user) => ({
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        dni: user.dni,
        estado: UserStatus.CREADO,
      }));

    console.log(
      '[UsersService.findCreatedUsers] Usuarios pendientes devueltos:',
      pendingUsers.map((user) => ({ id: user.id, dni: user.dni, estado: user.estado })),
    );

    return pendingUsers;
  }

  async findActiveClients(gimnasioId: number) {
    console.log('[UsersService.findActiveClients] Buscando usuarios activos', { gimnasioId });

    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect(
        'user.userMembresias',
        'userMembresias'
      )
      .leftJoinAndSelect(
        'userMembresias.membresia',
        'membresia'
      )
      .leftJoinAndSelect(
        'userMembresias.estado',
        'estadoUserMembresia'
      )
      .where('user.gimnasioId = :gimnasioId', { gimnasioId })
      .andWhere('user.role = :role', { role: UserRole.CLIENTE })
      .andWhere("LOWER(TRIM(COALESCE(user.estado, :fallback))) = :estado", {
        fallback: UserStatus.CREADO,
        estado: UserStatus.ACTIVO,
      })
      .orderBy('user.id', 'ASC')
      .getMany();

    console.log(
      '[UsersService.findActiveClients] Usuarios encontrados:',
      users.map((u) => ({ id: u.id, email: u.email, estado: u.estado }))
    );

    const response = users.map((user) => {
      const sortedMemberships = [...(user.userMembresias ?? [])].sort((a, b) => {
        const dateDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (dateDiff !== 0) {
          return dateDiff;
        }

        return (b.id ?? 0) - (a.id ?? 0);
      });

      const latestMembership = sortedMemberships[0];

      const membership = latestMembership?.membresia;
      const membershipStateName = latestMembership?.estado?.nombre?.toUpperCase();
      const isUpToDate = membershipStateName === 'AL_DIA';

      const memberships = sortedMemberships.map((item) => ({
        membresiaId: item.membresiaId,
        nombre: item.membresia?.nombre ?? 'Sin membresia',
        dias: item.membresia?.dias ?? null,
        estadoPago: String(item.estado?.nombre ?? '').toUpperCase() === 'AL_DIA' ? 'alDia' : 'cuotaPendiente',
      }));

      return {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        dni: user.dni,
        email: user.email,
        estado: user.estado,
        membresiaId: membership?.id ?? null,
        membresia: membership?.nombre ?? 'Sin membresia',
        frecuenciaDias: membership?.dias ?? null,
        estadoPago: isUpToDate ? 'alDia' : 'cuotaPendiente',
        membresias: memberships,
      };
    });

    console.log('[UsersService.findActiveClients] Respuesta final clientes-activos:', response);

    return response;
  }

  async removeMembershipByAdmin(gimnasioId: number, userId: number, membresiaId: number) {
    await this.getUserWithinGimnasio(gimnasioId, userId);

    const membership = await this.userMembresiaRepository.findOne({
      where: { userId, membresiaId },
      relations: ['membresia'],
    });

    if (!membership) {
      throw new NotFoundException('La membresia indicada no esta asignada al usuario.');
    }

    const paymentsCount = await this.pagoRepository.count({
      where: { userMembresiaId: membership.id },
    });

    if (paymentsCount > 0) {
      throw new ConflictException('No se puede eliminar la membresia del usuario porque tiene pagos asociados.');
    }

    await this.userMembresiaRepository.remove(membership);

    return {
      message: 'Membresia eliminada del usuario correctamente.',
      userId,
      membresiaId,
    };
  }

  async findOne(gimnasioId: number, id: number) {
    const user = await this.getUserWithinGimnasio(gimnasioId, id);
    return this.sanitizeUser(user);
  }

  async updateEstado(gimnasioId: number, id: number, estado: UserStatus) {
    const user = await this.getUserWithinGimnasio(gimnasioId, id);

    user.estado = estado;
    const updated = await this.userRepository.save(user);
    return this.sanitizeUser(updated);
  }

  // Un usuario tiene una unica membresia activa a la vez: asignar una nueva
  // siempre reemplaza la anterior (reapuntando la misma fila) en vez de
  // agregar una fila adicional.
  async updateMembershipByAdmin(gimnasioId: number, userId: number, membresiaId: number) {
    await this.getUserWithinGimnasio(gimnasioId, userId);

    const membresia = await this.membresiaRepository.findOne({
      where: { id: membresiaId, gimnasioId },
    });
    if (!membresia) {
      throw new NotFoundException(`No se encontro la membresia con id ${membresiaId}`);
    }

    const estadoPendiente = await this.estadoUserMembresiaRepository.findOne({
      where: { nombre: 'PENDIENTE_PAGO' },
    });

    if (!estadoPendiente) {
      throw new NotFoundException('Estado PENDIENTE_PAGO no encontrado');
    }

    const existingMembership = await this.userMembresiaRepository.findOne({
      where: { userId },
      order: { id: 'DESC' },
    });

    // Si el usuario esta sin membresia, creamos la instancia base en user_membresia.
    if (!existingMembership) {
      const createdMembership = this.userMembresiaRepository.create({
        userId,
        membresiaId,
        estadoId: estadoPendiente.id,
      });

      const savedCreatedMembership = await this.userMembresiaRepository.save(createdMembership);

      await this.userMembresiaRepository.update(savedCreatedMembership.id, {
        createdAt: new Date(),
      });

      return this.userMembresiaRepository.findOne({
        where: { id: savedCreatedMembership.id },
        relations: ['membresia', 'estado'],
      });
    }

    // Caso normal: reapuntamos la fila existente a la nueva membresia.
    existingMembership.membresiaId = membresiaId;
    existingMembership.membresia = membresia;
    existingMembership.estadoId = estadoPendiente.id;

    const savedMembership = await this.userMembresiaRepository.save(existingMembership);

    // Marcamos como vigente la fila puntero para que se refleje en listados.
    await this.userMembresiaRepository.update(savedMembership.id, {
      createdAt: new Date(),
    });

    return this.userMembresiaRepository.findOne({
      where: { id: savedMembership.id },
      relations: ['membresia', 'estado'],
    });
  }

  async markPaymentAsUpToDateByAdmin(gimnasioId: number, userId: number, membresiaId?: number) {
    await this.getUserWithinGimnasio(gimnasioId, userId);

    let latestMembership: UserMembresia | null = null;

    if (membresiaId) {
      latestMembership = await this.userMembresiaRepository.findOne({
        where: { userId, membresiaId },
        relations: ['membresia'],
      });
    }

    if (!latestMembership) {
      latestMembership = await this.userMembresiaRepository
        .createQueryBuilder('userMembresia')
        .leftJoinAndSelect('userMembresia.membresia', 'membresia')
        .where('userMembresia.userId = :userId', { userId })
        .orderBy('userMembresia.createdAt', 'DESC')
        .getOne();
    }

    if (!latestMembership) {
      throw new NotFoundException('El usuario no tiene membresia asignada');
    }

    const estadoAlDia = await this.estadoUserMembresiaRepository.findOne({
      where: { nombre: 'AL_DIA' },
    });

    if (!estadoAlDia) {
      throw new NotFoundException('Estado AL_DIA no encontrado');
    }

    await this.userMembresiaRepository.update(
      { userId: latestMembership.userId, membresiaId: latestMembership.membresiaId },
      { estadoId: estadoAlDia.id },
    );

    const refreshedMembership = await this.userMembresiaRepository.findOne({
      where: { userId: latestMembership.userId, membresiaId: latestMembership.membresiaId },
      relations: ['membresia', 'estado'],
    });

    if (!refreshedMembership) {
      throw new NotFoundException('No se pudo recuperar la membresia del usuario luego de actualizar el estado.');
    }

    const pago = this.pagoRepository.create({
      userId,
      userMembresiaId: refreshedMembership.id,
      membresiaId: refreshedMembership.membresiaId,
      metodoPago: 'efectivo',
      user: { id: userId } as User,
      userMembresia: { id: refreshedMembership.id } as UserMembresia,
      membresia: { id: refreshedMembership.membresiaId } as Membresia,
    });
    const savedPayment = await this.pagoRepository.save(pago);

    return {
      message: 'Pago actualizado a al dia',
      pagoId: savedPayment.id,
      userId,
      userMembresiaId: refreshedMembership.id,
      membresiaId: latestMembership.membresiaId,
      createdAt: savedPayment.createdAt,
    };
  }

  async remove(gimnasioId: number, id: number) {
    const result = await this.userRepository.delete({ id, gimnasioId });

    if (!result.affected) {
      throw new NotFoundException(`No se encontro el usuario con id ${id}`);
    }

    return { message: 'Usuario eliminado correctamente.' };
  }

  // Trae un usuario verificando que pertenezca al gimnasio indicado; usarlo
  // en vez de userRepository.findOne({ where: { id } }) evita que un admin
  // de un gimnasio pueda leer/editar usuarios de otro gimnasio por id.
  private async getUserWithinGimnasio(gimnasioId: number, id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id, gimnasioId } });

    if (!user) {
      throw new NotFoundException(`No se encontro el usuario con id ${id}`);
    }

    return user;
  }

  private sanitizeUser(user: User) {
    const { password_hash, ...result } = user;
    return result;
  }
}
