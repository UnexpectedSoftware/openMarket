export default class Order {

  contructor({ idGenerator, lines }) {
        /**
         * @type {String}
         * */
    this.id = idGenerator.generate();

        /**
         * @type {Date}
         * */
    this.createdAt = new Date().toLocaleString('es-ES');
  }

}
