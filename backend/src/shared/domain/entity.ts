// Base de las entidades de dominio: tienen identidad propia y dos entidades
// son la misma si tienen el mismo id, aunque cambien sus otros datos.
export abstract class Entity<Id extends string | number> {
  protected constructor(readonly id: Id) {}

  equals(other?: Entity<Id>): boolean {
    if (!other || other.constructor !== this.constructor) {
      return false;
    }
    return this.id === other.id;
  }
}
