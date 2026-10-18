/**
 * Creator do padrão Factory Method.
 *
 * Subclasses concretas implementam o factory method `createView` (como construir um
 * objeto de visualização a partir de uma origem); a operação `createViews` é comum
 * e depende apenas da abstração, nunca de um produto concreto.
 */
export abstract class ViewFactory<TSource, TView> {
  /** Factory method: constrói um único objeto de visualização. */
  abstract createView(source: TSource): TView

  createViews(sources: readonly TSource[]): TView[] {
    return sources.map((source) => this.createView(source))
  }
}
