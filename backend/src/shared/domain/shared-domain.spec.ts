import { Entity } from './entity';
import { ValueObject } from './value-object';

class Dni extends ValueObject<{ valor: string }> {
  static crear(valor: string): Dni {
    return new Dni({ valor });
  }

  get valor(): string {
    return this.props.valor;
  }
}

class Cuit extends ValueObject<{ valor: string }> {
  static crear(valor: string): Cuit {
    return new Cuit({ valor });
  }
}

class Socio extends Entity<number> {
  constructor(
    id: number,
    readonly nombre: string,
  ) {
    super(id);
  }
}

describe('ValueObject', () => {
  it('dos VO con los mismos valores son iguales', () => {
    expect(Dni.crear('30111222').equals(Dni.crear('30111222'))).toBe(true);
  });

  it('VO con valores distintos o de otra clase no son iguales', () => {
    expect(Dni.crear('1').equals(Dni.crear('2'))).toBe(false);
    expect(Dni.crear('1').equals(Cuit.crear('1'))).toBe(false);
    expect(Dni.crear('1').equals(undefined)).toBe(false);
  });

  it('es inmutable', () => {
    const dni = Dni.crear('1');
    expect(() => {
      (dni as unknown as { props: { valor: string } }).props.valor = '2';
    }).toThrow(TypeError);
    expect(dni.valor).toBe('1');
  });
});

describe('Entity', () => {
  it('dos entidades con el mismo id son la misma aunque cambien sus datos', () => {
    expect(new Socio(1, 'Ana').equals(new Socio(1, 'Ana Maria'))).toBe(true);
  });

  it('entidades con distinto id son distintas aunque tengan los mismos datos', () => {
    expect(new Socio(1, 'Ana').equals(new Socio(2, 'Ana'))).toBe(false);
    expect(new Socio(1, 'Ana').equals(undefined)).toBe(false);
  });
});
