const HTTP_STATUS = require("../constants/api.constants.js");
const getDaos = require("../models/daos/factory.js");
const { GetProductDTO, UpdateProductDTO, AddProductDTO } = require("../models/dtos/products.dto.js");
const HttpError = require("../utils/error.utils.js");
const MailService = require("./mail.service.js");

const { productsDao } = getDaos()

const mailService = new MailService()

class ProductsService {
    async getProducts(filter = {}) {
        const products = await productsDao.getAll(filter)
        const productsPayloadDTO = []
        products.docs.forEach(product => {
            productsPayloadDTO.push(new GetProductDTO(product))
        });
        return productsPayloadDTO
    }

    async getProductById(pid) {
        if(!pid){
            throw new HttpError('Missing param', HTTP_STATUS.BAD_REQUEST)
        }
        const product = await productsDao.getById(pid)
        if(!product){
            throw new HttpError('Product not found', HTTP_STATUS.NOT_FOUND)
        }
        const productPayloadDTO = new GetProductDTO(product)
        return productPayloadDTO
    }

    async createProduct(productPayload, files, owner){
        const { title, description, code, stock, price, category } = productPayload
        if(!title || !description || !code || !stock || !price || !category){
            throw new HttpError('Please include all the required fields', HTTP_STATUS.BAD_REQUEST)
        }
        console.log(owner);
        const productPayloadDTO = new AddProductDTO(productPayload, files, owner)
        const newProduct = productsDao.add(productPayloadDTO)
        return newProduct
    }

    async updateProduct(pid, productPayload){
        if(!pid || !productPayload){
            throw HttpError('Please provide an id and a payload for the product', HTTP_STATUS.BAD_REQUEST)
        }
        const product = await productsDao.getById(pid)
        if(!product){
            throw new HttpError('Product not found', HTTP_STATUS.NOT_FOUND)
        }
        const productPayloadDTO = new UpdateProductDTO(productPayload)
        const updatedProduct = await productsDao.updateById(pid, productPayloadDTO)
        return updatedProduct
    }

    async deleteProduct(pid, user){
        if(!pid){
            throw HttpError('Please specify a product ID', HTTP_STATUS.BAD_REQUEST)
        }
        const product = await productsDao.getById(pid)
        if(!product){
            throw new HttpError('Product not found', HTTP_STATUS.NOT_FOUND)
        }
        if(user.role === 'premium' && user.email !== product.owner){
            throw new HttpError("Only product's owner can delete this resource", HTTP_STATUS.FORBIDDEN)
        }
        if(product.owner !== 'adminCoder@coder.com'){
            await mailService.productDeletion(product.owner, product.title)
        }
        const deletedProduct = await productsDao.delete(pid)
        return deletedProduct
    }

}

module.exports = ProductsService