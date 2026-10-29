import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt'; //Librería para hashear password
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';
import { UserStatus } from './enums/user-status.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) // Inyecta el repositorio de TypeORM y permite hacer Querys
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const normalizedEmail = createUserDto.email.trim().toLowerCase();

    // VALIDACIÓN PREVIA: Verificar si el email ya existe
    const userExists = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (userExists) {
      throw new ConflictException('El correo electronico ya esta registrado.');
    }

    // En desarrollo local usamos menos rondas para mejorar tiempos de respuesta.
    const defaultRounds = process.env.NODE_ENV === 'production' ? 10 : 8;
    const configuredRounds = Number(
      process.env.BCRYPT_SALT_ROUNDS ?? defaultRounds,
    );
    const saltRounds =
      Number.isFinite(configuredRounds) && configuredRounds > 3
        ? configuredRounds
        : defaultRounds;

    //HASHEAR PASSWORD: NUNCA guardes contraseña en plano
    //bcrypt genera un hash + salt
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltRounds,
    );

    //CREAR OBJETO USER para guardar en BD
    const newUser = this.userRepository.create({
      nombre: createUserDto.nombre,
      apellido: createUserDto.apellido,
      email: normalizedEmail,
      dni: createUserDto.dni,
      password_hash: hashedPassword, // Guardamos el HASH
      role: UserRole.CLIENTE,
      estado: UserStatus.CREADO,
      // planEntrenamiento se inicializa en null automáticamente
    });

    //GUARDAR EN BASE DE DATOS
    // Try-catch como respaldo para race conditions en requests concurrentes
    let userSaved: User;
    try {
      userSaved = await this.userRepository.save(newUser);
    } catch (error) {
      // Maneja conflictos de unicidad en DB (ej. dos registros concurrentes con el mismo email)
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string } | undefined)?.code === '23505'
      ) {
        throw new ConflictException(
          'El correo electronico ya esta registrado.',
        );
      }
      throw error;
    }

    //RESPUESTA: Devolver usuario SIN la password
    // Hacemos un objeto nuevo excluyendo password_hash
    return this.sanitizeUser(userSaved);
  }

  async findAll() {
    const users = await this.userRepository.find({
      order: { id: 'ASC' },
    });

    return users.map((user) => this.sanitizeUser(user));
  }

  async findCreatedUsers() {
    console.log(
      '[UsersService.findCreatedUsers] Iniciando busqueda de usuarios pendientes',
    );

    const users = await this.userRepository.find({
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

    console.log(
      `[UsersService.findCreatedUsers] Usuarios leidos desde DB: ${users.length}`,
    );

    const normalize = (value: string | null | undefined): string =>
      String(value ?? '')
        .trim()
        .toLowerCase();

    const pendingUsers = users
      .filter((user) => {
        const normalizedRole = normalize(user.role);
        const normalizedEstado = normalize(user.estado);

        const isClient = normalizedRole === normalize(UserRole.CLIENTE);
        const isCreated =
          normalizedEstado === '' ||
          normalizedEstado === normalize(UserStatus.CREADO);

        if (!isClient || !isCreated) {
          console.log(
            '[UsersService.findCreatedUsers] Usuario descartado por filtro',
            {
              id: user.id,
              roleOriginal: user.role,
              estadoOriginal: user.estado,
              roleNormalizado: normalizedRole,
              estadoNormalizado: normalizedEstado,
              isClient,
              isCreated,
            },
          );
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
      pendingUsers.map((user) => ({
        id: user.id,
        dni: user.dni,
        estado: user.estado,
      })),
    );

    return pendingUsers;
  }

  async findActiveClients() {
    console.log('[UsersService.findActiveClients] Buscando usuarios activos');

    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.CLIENTE })
      .andWhere('LOWER(TRIM(COALESCE(user.estado, :fallback))) = :estado', {
        fallback: UserStatus.CREADO,
        estado: UserStatus.ACTIVO,
      })
      .orderBy('user.id', 'ASC')
      .getMany();

    console.log(
      '[UsersService.findActiveClients] Usuarios encontrados:',
      users.map((u) => ({ id: u.id, email: u.email, estado: u.estado })),
    );

    const response = users.map((user) => ({
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      dni: user.dni,
      email: user.email,
      estado: user.estado,
    }));

    console.log(
      '[UsersService.findActiveClients] Respuesta final clientes-activos:',
      response,
    );

    return response;
  }

  async findOne(id: number) {
    const user = await this.getUserById(id);
    return this.sanitizeUser(user);
  }

  async updateEstado(id: number, estado: UserStatus) {
    const user = await this.getUserById(id);

    user.estado = estado;
    const updated = await this.userRepository.save(user);
    return this.sanitizeUser(updated);
  }

  async remove(id: number) {
    const result = await this.userRepository.delete({ id });

    if (!result.affected) {
      throw new NotFoundException(`No se encontro el usuario con id ${id}`);
    }

    return { message: 'Usuario eliminado correctamente.' };
  }

  private async getUserById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

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
