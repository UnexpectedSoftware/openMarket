import {expect} from 'chai';
import sinon from 'sinon';
import OrderFactoryImpl from "../../../../openMarket/infrastructure/order/OrderFactoryImpl";
import SqlOrderMapper from "../../../../openMarket/infrastructure/order/SqlOrderMapper";
import UUIDIdentity from "../../../../openMarket/infrastructure/service/UUIDIdentity";


const orderFactory = new OrderFactoryImpl({identity: new UUIDIdentity()});

describe('Sql Order Mapper', () => {
  describe('Given Order rows data from sql', () => {
    it('should return an Observable of one Order', (done) => {

      const givenRows = [
        {
          id: 27,
          created_at: '04-feb-2004 0:00:00',
          total: 13.33,
          line_barcode: '8410100021546',
          line_name: 'Odin',
          line_price: 7.15,
          line_quantity: 1
        },
        {
          id: 27,
          created_at: '04-feb-2004 0:00:00',
          total: 13.33,
          line_barcode: '8410135001469',
          line_name: 'Thor',
          line_price: 1.05,
          line_quantity: 2
        },
        {
          id: 27,
          created_at: '04-feb-2004 0:00:00',
          total: 13.33,
          line_barcode: '8410189206506',
          line_name: 'Heimdall',
          line_price: 3.35,
          line_quantity: 1
        }
      ];

      const sqlOrderMapper = new SqlOrderMapper({orderFactory});

      const spyNext = sinon.spy();

      const expectedOrder = orderFactory.createWith({
        id: 27,
        date: '04-feb-2004 0:00:00',
        lines: [
          {
            barcode: "8410100021546",
            name: "Odin",
            price: 7.15,
            quantity: 1
          },
          {
            barcode: "8410135001469",
            name: "Thor",
            price: 1.05,
            quantity: 2
          },
          {
            barcode: "8410189206506",
            name: "Heimdall",
            price: 3.35,
            quantity: 1
          }
        ]
      });

      sqlOrderMapper.toDomain({
        rows: givenRows
      })
        .subscribe(
          (data) => {
            expect(data).to.deep.equals(expectedOrder);
            spyNext()
          },
          (error) => done(new Error(error)),
          () => {
            expect(spyNext.called).to.be.true
            done();
          }
        );
    });
  });
});
