import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Horario } from './entities/horario.entity';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { UpdateHorarioDto } from './dto/update-horario.dto';

@Injectable()
export class HorarioService {
  constructor(
    @InjectRepository(Horario)
    private readonly horarioRepository: Repository<Horario>,
  ) {}

  async findAllByGimnasio(gimnasioId: number): Promise<Horario[]> {
    return this.horarioRepository.find({
      where: { gimnasioId },
      order: { id: 'ASC' },
    });
  }

  async create(gimnasioId: number, createHorarioDto: CreateHorarioDto): Promise<Horario> {
    const horario = this.horarioRepository.create({
      gimnasioId,
      descripcion: createHorarioDto.descripcion.trim(),
      horario: createHorarioDto.horario.trim(),
    });

    return this.horarioRepository.save(horario);
  }

  // Verifica que la fila pertenezca al gimnasio del admin antes de tocarla,
  // para que un admin nunca pueda editar/borrar horarios de otro gimnasio.
  private async getHorarioWithinGimnasio(gimnasioId: number, id: number): Promise<Horario> {
    const horario = await this.horarioRepository.findOne({ where: { id, gimnasioId } });

    if (!horario) {
      throw new NotFoundException(`No se encontro el horario con id ${id}`);
    }

    return horario;
  }

  async update(gimnasioId: number, id: number, updateHorarioDto: UpdateHorarioDto): Promise<Horario> {
    const horario = await this.getHorarioWithinGimnasio(gimnasioId, id);

    if (typeof updateHorarioDto.descripcion === 'string') {
      horario.descripcion = updateHorarioDto.descripcion.trim();
    }

    if (typeof updateHorarioDto.horario === 'string') {
      horario.horario = updateHorarioDto.horario.trim();
    }

    return this.horarioRepository.save(horario);
  }

  async remove(gimnasioId: number, id: number): Promise<{ message: string; id: number }> {
    const horario = await this.getHorarioWithinGimnasio(gimnasioId, id);
    await this.horarioRepository.remove(horario);

    return { message: 'Horario eliminado correctamente.', id };
  }
}
