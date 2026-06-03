import { PaymentStatus, PrismaClient } from "@prisma/client";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import express from 'express'
const router = express.Router()
const prisma = new PrismaClient()


router.get('/:orderId', authMiddleware, async (req, res)=>{
    try{
        const order = await prisma.order.findUnique({
            where: {id: req.params.orderId },
            include: {
                customer: {select: {name: true, email: true, phone:true}},
                seller: {select: {storeName: true}},
                items: {include: {product: {select: {name: true, price: true }}}},
                shipping: true,

            },
        })
        if(!order) {
        return res.status(404).json ({ message: 'Order not found'})
        
    }
    if ( order.customerId !== req.user.id && order.sellerId !== req.user.id && req.user.role !== 'ADMIN'){
        return res.status(403).json ({message: 'Unauthorized '})
    }

    const invoiceHTML = generateInvoiceHTML(order)

    res.json({
        data:{
            orderNumber: order.orderNumber,
            html: invoiceHTML,
            fileName: `invoice-${order.orderNumber}.pdf`
        }
    })


    }catch(err){
        console.error('Generaate invoice error:', err)
        res.status(500).json({ message: 'Failed to generate invoice'})
    }
})

router.get('/:orderId/download', authMiddleware, async(req, res) => {
    try{
        const order = await prisma.order.findUnique({
            where: {id: req.params.orderId },
            include: {
                customer: true,
                seller: true,
                items: {include: {product: true}},
                shipping: true,
            }
        })

        if(!order){
            return res.status(400).json({ message: 'Order not found'})
        }

        if(order.customerId !== req.user.id && order.sellerId !== req.user.id && req.user.role !== 'ADMIN'){
            return res.status(403).json({ message: 'Unauthorized'})
        }

        const invoiceData = {
            orderName: order.orderNumber,
            orderDate: order.createdAt,
            customer: order.customer,
            seller: order.seller,
            items: order.items,
            shipping: order.shipping,
            subtotal: order.subtotal,
            tax: order.tax,
            shipping: order.shipping,
            discount: order.discount,
            total: order.total,
            PaymentStatus: order.status,
        }
        res.json({ data: invoiceData })

    }catch(err){
        res.status(500).json({ message:'Failed to download invoice'})

    }

    function generateInvoiceHTML(order){
        const itemsHTML = order.items
        .map(
      item => `
    <tr>
      <td>${item.product.name}</td>
      <td>${item.quantity}</td>
      <td>$${item.price.toFixed(2)}</td>
      <td>$${item.total.toFixed(2)}</td>
    </tr>
  `
    )
    .json('')
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${order.orderNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .invoice-title { font-size: 24px; font-weight: bold; }
        .content { margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .summary { width: 50%; margin-left: auto; margin-top: 20px; }
        .summary-row { display: flex; justify-content: space-between; padding: 8px 0; }
        .total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
        .status { color: #16a34a; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="invoice-title">INVOICE</div>
        <p>Order #${order.orderNumber}</p>
      </div>

      <div class="content">
        <h3>Billing Information</h3>
        <p><strong>Customer:</strong> ${order.customer.name}</p>
        <p><strong>Email:</strong> ${order.customer.email}</p>
        <p><strong>Phone:</strong> ${order.customer.phone}</p>

        <h3>Shipping Address</h3>
        <p>${order.shipping.fullName}</p>
        <p>${order.shipping.street}</p>
        <p>${order.shipping.city}, ${order.shipping.state} ${order.shipping.zipCode}</p>
        <p>${order.shipping.country}</p>

        <h3>Order Details</h3>
        <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
        <p><strong>Status:</strong> <span class="status">${order.status}</span></p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-row">
          <span>Subtotal:</span>
          <span>$${order.subtotal.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Tax:</span>
          <span>$${order.tax.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Shipping:</span>
          <span>$${order.shipping.toFixed(2)}</span>
        </div>
        ${order.discount > 0 ? `
        <div class="summary-row">
          <span>Discount:</span>
          <span>-$${order.discount.toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="summary-row total">
          <span>Total:</span>
          <span>$${order.total.toFixed(2)}</span>
        </div>
      </div>

      <p style="margin-top: 40px; color: #666; font-size: 12px;">
        Thank you for your purchase! This invoice was generated on ${new Date().toLocaleDateString()}.
      </p>
    </body>
    </html>
  `
    }
})

export default router