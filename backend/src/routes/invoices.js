import { PaymentStatus, PrismaClient } from "@prisma/client";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import express from 'express'
import puppeteer from 'puppeteer'
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

router.get('/:orderId/download', authMiddleware, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      include: {
        customer: true,
        seller: true,
        items: { include: { product: true } },
        shipping: true,
      }
    })

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    if (
      order.customerId !== req.user.id &&
      order.sellerId !== req.user.id &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    const html = generateInvoiceHTML(order)

    // 🧠 Create PDF
    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true
    })

    await browser.close()

    // 📥 Send file download
   res.setHeader('Content-Type', 'application/pdf')
res.setHeader(
  'Content-Disposition',
  `attachment; filename=invoice-${order.orderNumber}.pdf`
)
res.setHeader('Content-Length', pdfBuffer.length)

return res.end(pdfBuffer)

  } catch (err) {
    console.error('PDF ERROR:', err)
  res.status(500).json({ message: 'Failed to generate PDF', error: err.message })
  }
})

function generateInvoiceHTML(order) {
  const itemsHTML = order.items
    .map(item => {
      const total = item.price * item.quantity
      return `
        <tr>
          <td>
            <div class="item-name">${item.product.name}</div>
          </td>
          <td class="center">${item.quantity}</td>
          <td class="right">₹${item.price.toLocaleString('en-IN')}</td>
          <td class="right item-total">₹${total.toLocaleString('en-IN')}</td>
        </tr>
      `
    })
    .join('')

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingFee = order.shipping?.fee || 0
  const tax = order.tax || 0
  const grandTotal = order.total

  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

  const statusColors = {
    PAID: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
    PENDING: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
    FAILED: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  }
  const statusStyle = statusColors[order.paymentStatus] || statusColors.PENDING

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${order.orderNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          color: #1F2937;
          background: #ffffff;
          padding: 48px 56px;
          font-size: 13px;
          line-height: 1.5;
        }

        /* ===== Header ===== */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 28px;
          border-bottom: 2px solid #111827;
          margin-bottom: 32px;
        }

        .brand {
          display: flex;
          flex-direction: column;
        }

        .brand-mark {
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, #4F46E5, #7C3AED);
          border-radius: 10px;
          margin-bottom: 12px;
        }

        .brand-name {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #111827;
        }

        .brand-sub {
          font-size: 11px;
          color: #6B7280;
          margin-top: 2px;
        }

        .invoice-meta {
          text-align: right;
        }

        .invoice-title {
          font-size: 28px;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.5px;
          margin-bottom: 6px;
        }

        .invoice-number {
          font-size: 13px;
          color: #6B7280;
          margin-bottom: 10px;
        }

        .status-badge {
          display: inline-block;
          padding: 5px 14px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          background: ${statusStyle.bg};
          color: ${statusStyle.text};
          border: 1px solid ${statusStyle.border};
        }

        /* ===== Parties ===== */
        .parties {
          display: flex;
          justify-content: space-between;
          gap: 40px;
          margin-bottom: 36px;
        }

        .party-block {
          flex: 1;
        }

        .party-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #9CA3AF;
          margin-bottom: 8px;
        }

        .party-name {
          font-size: 14px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
        }

        .party-detail {
          font-size: 12px;
          color: #6B7280;
          line-height: 1.6;
        }

        .meta-row {
          display: flex;
          gap: 32px;
          margin-bottom: 36px;
          padding: 16px 20px;
          background: #F9FAFB;
          border-radius: 10px;
        }

        .meta-item {
          flex: 1;
        }

        .meta-item-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #9CA3AF;
          margin-bottom: 4px;
        }

        .meta-item-value {
          font-size: 13px;
          font-weight: 600;
          color: #111827;
        }

        /* ===== Table ===== */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 28px;
        }

        thead th {
          text-align: left;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #6B7280;
          padding: 0 0 12px 0;
          border-bottom: 2px solid #111827;
        }

        thead th.center { text-align: center; }
        thead th.right { text-align: right; }

        tbody td {
          padding: 14px 0;
          border-bottom: 1px solid #F3F4F6;
          font-size: 13px;
          color: #374151;
        }

        .item-name {
          font-weight: 600;
          color: #111827;
        }

        .center { text-align: center; }
        .right { text-align: right; }
        .item-total { font-weight: 600; color: #111827; }

        /* ===== Totals ===== */
        .totals-wrap {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }

        .totals {
          width: 280px;
        }

        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 13px;
          color: #6B7280;
        }

        .totals-row.grand {
          margin-top: 8px;
          padding-top: 14px;
          border-top: 2px solid #111827;
          font-size: 16px;
          font-weight: 800;
          color: #111827;
        }

        .totals-row.grand span:last-child {
          color: #4F46E5;
        }

        /* ===== Footer ===== */
        .footer {
          padding-top: 24px;
          border-top: 1px solid #E5E7EB;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-note {
          font-size: 11px;
          color: #9CA3AF;
          max-width: 60%;
          line-height: 1.6;
        }

        .footer-thanks {
          font-size: 13px;
          font-weight: 700;
          color: #4F46E5;
        }
      </style>
    </head>
    <body>

      <div class="header">
        <div class="brand">
          <div class="brand-mark"></div>
          <div class="brand-name">${order.seller?.storeName || 'ShopSphere'}</div>
          <div class="brand-sub">Multi-vendor Marketplace</div>
        </div>
        <div class="invoice-meta">
          <div class="invoice-title">INVOICE</div>
          <div class="invoice-number">#${order.orderNumber}</div>
          <span class="status-badge">${order.paymentStatus || 'PENDING'}</span>
        </div>
      </div>

      <div class="parties">
        <div class="party-block">
          <div class="party-label">Billed To</div>
          <div class="party-name">${order.customer.name}</div>
          <div class="party-detail">
            ${order.customer.email}<br>
            ${order.customer.phone || ''}
          </div>
        </div>
        <div class="party-block">
          <div class="party-label">Sold By</div>
          <div class="party-name">${order.seller?.storeName || 'Seller'}</div>
          <div class="party-detail">
            ${order.shipping?.address || ''}
          </div>
        </div>
      </div>

      <div class="meta-row">
        <div class="meta-item">
          <div class="meta-item-label">Invoice Date</div>
          <div class="meta-item-value">${orderDate}</div>
        </div>
        <div class="meta-item">
          <div class="meta-item-label">Order Number</div>
          <div class="meta-item-value">${order.orderNumber}</div>
        </div>
        <div class="meta-item">
          <div class="meta-item-label">Payment Status</div>
          <div class="meta-item-value">${order.paymentStatus || 'PENDING'}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="center">Qty</th>
            <th class="right">Unit Price</th>
            <th class="right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div class="totals-wrap">
        <div class="totals">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>₹${subtotal.toLocaleString('en-IN')}</span>
          </div>
          ${shippingFee ? `
          <div class="totals-row">
            <span>Shipping</span>
            <span>₹${shippingFee.toLocaleString('en-IN')}</span>
          </div>` : ''}
          ${tax ? `
          <div class="totals-row">
            <span>Tax</span>
            <span>₹${tax.toLocaleString('en-IN')}</span>
          </div>` : ''}
          <div class="totals-row grand">
            <span>Total</span>
            <span>₹${grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div class="footer">
        <div class="footer-note">
          This is a computer-generated invoice and does not require a signature.
          For questions regarding this order, please contact the seller directly.
        </div>
        <div class="footer-thanks">Thank you for shopping with us!</div>
      </div>

    </body>
    </html>
  `
}

export default router