/**
 * @class FixturesService
 */
import RxLocalStorage from "../service/RxLocalStorage";
import {CATEGORIES_KEY, PRODUCTS_KEY, ORDERS_KEY} from "../service/LocalStorageKeys";

export default class FixturesService {

  load() {
    this.loadCategories();
    this.loadProducts();
    this.loadOrders();
  }

  loadCategories(){
    const data = [
      {"id":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","name":"Fruta","imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","products":[]},
      {"id":"529971af-4d59-48c9-9f64-24ede146f38d","name":"Conservas","imageUrl":"http://estaticos.mujeresreales.es/rcs/articles/2221/imagenes//CP_02-04-03_S491_opt.jpg","products":[]},
      {"id":"5203cb7b-7056-4242-951c-51836e3b42cb","name":"Vinos","imageUrl":"http://www.escuelaespanolalicante.com/wp-content/uploads/2016/02/copasvinos.jpg","products":[]},
      {"id":"3eda3af9-94b6-4d6c-8837-150ea26ec32a","name":"Fruta","imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","products":[]},
      {"id":"61c2c5f6-0f8e-4232-b3ee-4ed67c034af5","name":"Conservas","imageUrl":"http://estaticos.mujeresreales.es/rcs/articles/2221/imagenes//CP_02-04-03_S491_opt.jpg","products":[]},
      {"id":"6ebf9e32-3f0a-4c39-8937-16e19b321ecd","name":"Vinos","imageUrl":"http://www.escuelaespanolalicante.com/wp-content/uploads/2016/02/copasvinos.jpg","products":[]},
      {"id":"b0c71902-d327-4e49-8b31-af2e8c40de5c","name":"Fruta","imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","products":[]},
      {"id":"9e336af4-12fc-4f3a-bad1-656f60222cc0","name":"Conservas","imageUrl":"http://estaticos.mujeresreales.es/rcs/articles/2221/imagenes//CP_02-04-03_S491_opt.jpg","products":[]},
      {"id":"2313b64c-d1f0-43bf-9699-ffa4f4c835a0","name":"Vinos","imageUrl":"http://www.escuelaespanolalicante.com/wp-content/uploads/2016/02/copasvinos.jpg","products":[]},
      {"id":"138b3699-a8ae-4106-9cad-8bbc23450359","name":"Fruta","imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","products":[]},
      {"id":"d548cbcd-2d9a-412d-a4c1-80af6cd8dc1a","name":"Conservas","imageUrl":"http://estaticos.mujeresreales.es/rcs/articles/2221/imagenes//CP_02-04-03_S491_opt.jpg","products":[]},
      {"id":"c6c3ece3-79c0-4d2c-9256-89571906a0e8","name":"Vinos","imageUrl":"http://www.escuelaespanolalicante.com/wp-content/uploads/2016/02/copasvinos.jpg","products":[]}
      ];
    RxLocalStorage.saveLocalStorage({localStorageKey: CATEGORIES_KEY, value:data})
      .subscribe();
  }

  loadProducts(){
    const data = [
      {"_id":"Seq-0","_barcode":"0001","_name":"Coca-Cola","_description":"","_price":0.55,"_basePrice":0.3,"_stock":100,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-1","_barcode":"0002","_name":"Coca-Cola Zero","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1500,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-2","_barcode":"0003","_name":"Coca-Cola Zero sin cafeina","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-3","_barcode":"0004","_name":"Coca-Cola Zero zero","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-4","_barcode":"0005","_name":"Coca-Cola Zero 42","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-0","_barcode":"0006","_name":"Coca-Cola","_description":"","_price":0.55,"_basePrice":0.3,"_stock":100,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-1","_barcode":"0007","_name":"Coca-Cola Zero","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1500,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-2","_barcode":"0008","_name":"Coca-Cola Zero sin cafeina","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-3","_barcode":"0009","_name":"Coca-Cola Zero zero","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-4","_barcode":"0010","_name":"Coca-Cola Zero 42","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-0","_barcode":"0011","_name":"Coca-Cola","_description":"","_price":0.55,"_basePrice":0.3,"_stock":100,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-1","_barcode":"0012","_name":"Coca-Cola Zero","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1500,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-2","_barcode":"0013","_name":"Coca-Cola Zero sin cafeina","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-3","_barcode":"0014","_name":"Coca-Cola Zero zero","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-4","_barcode":"0015","_name":"Coca-Cola Zero 42","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-0","_barcode":"0016","_name":"Coca-Cola","_description":"","_price":0.55,"_basePrice":0.3,"_stock":100,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-1","_barcode":"0017","_name":"Coca-Cola Zero","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1500,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-2","_barcode":"0018","_name":"Coca-Cola Zero sin cafeina","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-3","_barcode":"0019","_name":"Coca-Cola Zero zero","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-4","_barcode":"0020","_name":"Coca-Cola Zero 42","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-0","_barcode":"0021","_name":"Coca-Cola","_description":"","_price":0.55,"_basePrice":0.3,"_stock":100,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-1","_barcode":"0022","_name":"Coca-Cola Zero","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1500,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-2","_barcode":"0023","_name":"Coca-Cola Zero sin cafeina","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-3","_barcode":"0024","_name":"Coca-Cola Zero zero","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-4","_barcode":"0025","_name":"Coca-Cola Zero 42","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-0","_barcode":"0026","_name":"Coca-Cola","_description":"","_price":0.55,"_basePrice":0.3,"_stock":100,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-1","_barcode":"0027","_name":"Coca-Cola Zero","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1500,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-2","_barcode":"0028","_name":"Coca-Cola Zero sin cafeina","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-3","_barcode":"0029","_name":"Coca-Cola Zero zero","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-4","_barcode":"0030","_name":"Coca-Cola Zero 42","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-0","_barcode":"0031","_name":"Coca-Cola","_description":"","_price":0.55,"_basePrice":0.3,"_stock":100,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-1","_barcode":"0032","_name":"Coca-Cola Zero","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1500,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-2","_barcode":"0033","_name":"Coca-Cola Zero sin cafeina","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-3","_barcode":"0034","_name":"Coca-Cola Zero zero","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-4","_barcode":"0035","_name":"Coca-Cola Zero 42","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-0","_barcode":"0036","_name":"Coca-Cola","_description":"","_price":0.55,"_basePrice":0.3,"_stock":100,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-1","_barcode":"0037","_name":"Coca-Cola Zero","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1500,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-2","_barcode":"0038","_name":"Coca-Cola Zero sin cafeina","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-3","_barcode":"0039","_name":"Coca-Cola Zero zero","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-4","_barcode":"0040","_name":"Coca-Cola Zero 42","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-2","_barcode":"0041","_name":"Coca-Cola Zero sin cafeina","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-3","_barcode":"0042","_name":"Coca-Cola Zero zero","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"},
      {"_id":"Seq-4","_barcode":"0043","_name":"Coca-Cola Zero 42","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","_categoryId":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","_status":"PRODUCT_ENABLED"}
      ];
    RxLocalStorage.saveLocalStorage({localStorageKey: PRODUCTS_KEY, value:data})
      .subscribe();
  }

  loadOrders() {
    const data = [
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf01","_createdAt":"01/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf02","_createdAt":"02/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf03","_createdAt":"15/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf04","_createdAt":"10/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf05","_createdAt":"16/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf06","_createdAt":"12/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf07","_createdAt":"14/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf01","_createdAt":"01/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf02","_createdAt":"02/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf03","_createdAt":"15/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf04","_createdAt":"10/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf05","_createdAt":"16/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf06","_createdAt":"12/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf07","_createdAt":"14/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf01","_createdAt":"01/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf02","_createdAt":"02/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf03","_createdAt":"15/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf04","_createdAt":"10/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf05","_createdAt":"16/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf06","_createdAt":"12/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf07","_createdAt":"14/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf01","_createdAt":"01/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf02","_createdAt":"02/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf03","_createdAt":"15/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf04","_createdAt":"10/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf05","_createdAt":"16/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf06","_createdAt":"12/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf07","_createdAt":"14/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf01","_createdAt":"01/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf02","_createdAt":"02/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf03","_createdAt":"15/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf04","_createdAt":"10/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf05","_createdAt":"16/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf06","_createdAt":"12/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf07","_createdAt":"14/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf01","_createdAt":"01/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf02","_createdAt":"02/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf03","_createdAt":"15/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf04","_createdAt":"10/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf05","_createdAt":"16/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf06","_createdAt":"12/07/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf03","_createdAt":"01/08/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"0f10e99f-bf87-441d-a611-f88eef67cf08","_createdAt":"06/08/2017 17:53:04","_lines":[{"name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55}
      ];
    RxLocalStorage.saveLocalStorage({localStorageKey: ORDERS_KEY, value:data})
      .subscribe();
  }

}
