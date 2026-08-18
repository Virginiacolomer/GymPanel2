import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gimnasio } from './entities/gimnasio.entity';
import { CreateGimnasioDto } from './dto/create-gimnasio.dto';
import { UpdateGimnasioContactoDto } from './dto/update-gimnasio-contacto.dto';
import { PlanGimnasio } from './enums/plan-gimnasio.enum';
import { FUNCIONALIDADES_POR_PLAN } from './funcionalidades';

@Injectable()
export class GimnasioService {
  constructor(
    @InjectRepository(Gimnasio)
    private readonly gimnasioRepository: Repository<Gimnasio>,
  ) {}

  async create(createGimnasioDto: CreateGimnasioDto): Promise<Gimnasio> {
    const slug = createGimnasioDto.slug.trim().toLowerCase();

    const existing = await this.gimnasioRepository.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException('Ya existe un gimnasio con ese identificador.');
    }

    const gimnasio = this.gimnasioRepository.create({
      ...createGimnasioDto,
      slug,
      nombre: createGimnasioDto.nombre.trim(),
    });

    return this.gimnasioRepository.save(gimnasio);
  }

  // Listado publico: solo lo necesario para poblar el selector de gimnasio
  // en las pantallas de login/registro. No expone telefono/direccion.
  async findAllActive(): Promise<Array<Pick<Gimnasio, 'id' | 'nombre' | 'slug'>>> {
    return this.gimnasioRepository.find({
      where: { activo: true },
      select: { id: true, nombre: true, slug: true },
      order: { nombre: 'ASC' },
    });
  }

  async findActiveById(id: number): Promise<Gimnasio> {
    const gimnasio = await this.gimnasioRepository.findOne({ where: { id } });

    if (!gimnasio || !gimnasio.activo) {
      throw new NotFoundException('El gimnasio seleccionado no existe o no esta disponible.');
    }

    return gimnasio;
  }

  // Datos de contacto del propio gimnasio del usuario logueado (admin o
  // cliente), identificado por el gimnasioId embebido en su JWT. Incluye el
  // plan y las funcionalidades habilitadas para que el frontend sepa que
  // botones del menu de administrador pintar en gris.
  async findContactInfo(gimnasioId: number): Promise<
    Pick<Gimnasio, 'nombre' | 'instagram' | 'telefono' | 'direccion' | 'plan'> & { funcionalidades: string[] }
  > {
    const gimnasio = await this.gimnasioRepository.findOne({
      where: { id: gimnasioId },
      select: { nombre: true, instagram: true, telefono: true, direccion: true, plan: true },
    });

    if (!gimnasio) {
      throw new NotFoundException('No se encontro el gimnasio.');
    }

    return {
      ...gimnasio,
      funcionalidades: FUNCIONALIDADES_POR_PLAN[gimnasio.plan] ?? [],
    };
  }

  // Solo para el SUPERADMIN: listado completo de gimnasios (activos e
  // inactivos) con su plan actual, para la pantalla de administracion de planes.
  async findAllForSuperAdmin(): Promise<Gimnasio[]> {
    return this.gimnasioRepository.find({ order: { nombre: 'ASC' } });
  }

  // Solo para el SUPERADMIN: cambia el plan de un gimnasio puntual.
  async updatePlan(id: number, plan: PlanGimnasio): Promise<Gimnasio> {
    const gimnasio = await this.gimnasioRepository.findOne({ where: { id } });

    if (!gimnasio) {
      throw new NotFoundException(`No se encontro el gimnasio con id ${id}`);
    }

    gimnasio.plan = plan;
    return this.gimnasioRepository.save(gimnasio);
  }

  async updateContactInfo(
    gimnasioId: number,
    updateGimnasioContactoDto: UpdateGimnasioContactoDto,
  ): Promise<Pick<Gimnasio, 'nombre' | 'instagram' | 'telefono' | 'direccion'>> {
    const gimnasio = await this.gimnasioRepository.findOne({ where: { id: gimnasioId } });

    if (!gimnasio) {
      throw new NotFoundException('No se encontro el gimnasio.');
    }

    if (typeof updateGimnasioContactoDto.instagram === 'string') {
      gimnasio.instagram = updateGimnasioContactoDto.instagram.trim() || null;
    }

    if (typeof updateGimnasioContactoDto.telefono === 'string') {
      gimnasio.telefono = updateGimnasioContactoDto.telefono.trim() || null;
    }

    if (typeof updateGimnasioContactoDto.direccion === 'string') {
      gimnasio.direccion = updateGimnasioContactoDto.direccion.trim() || null;
    }

    await this.gimnasioRepository.save(gimnasio);

    return this.findContactInfo(gimnasioId);
  }
}
