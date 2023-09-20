const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.list = async function(req, res, next) {
    try {
        const products = await prisma.product_panel.findMany();
        res.json(products);
    } catch (e) {
        next(e);
    }
}

exports.show = async function(req, res, next) {
    const id = parseInt(req.params.id, 10);
    try {
        const product = await prisma.product_panel.findUnique({ where: { id } });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (e) {
        next(e);
    }
}

exports.update = async function(req, res, next) {
    const id = parseInt(req.params.id, 10);
    const body = req.body;
    try {
        const updatedProduct = await prisma.product_panel.update({
            where: { id },
            data: body
        });
        res.status(201).json(updatedProduct);
    } catch (e) {
        next(e);
    }
}

exports.create = async function(req, res, next) {
    const { user, role } = req.token;
    const newProduct = {
        ...req.body,
        userId: user
    };
    try {
        const createdProduct = await prisma.product_panel.create({ data: newProduct });
        res.json(createdProduct);
    } catch (e) {
        next(e);
    }
}

exports.destroy = async function(req, res, next) {
    const id = parseInt(req.params.id, 10);
    try {
        const deletedProduct = await prisma.product_panel.delete({ where: { id } });
        res.json(deletedProduct);
    } catch (e) {
        console.log(e);
        next(e);
    }
}
