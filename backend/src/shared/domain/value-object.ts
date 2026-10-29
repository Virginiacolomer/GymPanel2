// Base de los Value Objects: sin identidad, inmutables e iguales por valor.
// Cada subclase valida sus datos en su factory (ej. Email.crear) antes de
// llamar al constructor, para que nunca exista un VO invalido.
export abstract class ValueObject<Props extends object> {
  protected readonly props: Readonly<Props>;

  protected constructor(props: Props) {
    this.props = Object.freeze({ ...props });
  }

  equals(other?: ValueObject<Props>): boolean {
    if (!other || other.constructor !== this.constructor) {
      return false;
    }
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}
