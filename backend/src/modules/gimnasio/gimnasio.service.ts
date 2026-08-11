import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gimnasio } from './entities/gimnasio.entity';
import { CreateGimnasioDto } from './dto/create-gimnasio.dto';

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
}
