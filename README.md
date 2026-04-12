This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


**SKU** and **Slug** are standard ecommerce fields:

✅ **SKU = Stock Keeping Unit**
- Unique product identifier for inventory tracking
- Used for warehouse management, ordering and stock counting
- Example: `ISL-BOOK-001`, `PRD-7892`
- You can make your own codes or leave it blank
- Not visible to customers, only used in admin

✅ **Slug = URL Friendly Product Name**
- This becomes the web address for your product page
- Automatically created from product name (you can edit it)
- Must have only lowercase letters, numbers and hyphens (no spaces)
- Example: if product name is "Islamic Prayer Mat" the slug becomes `islamic-prayer-mat`
- Final URL will be: `yourwebsite.com/products/islamic-prayer-mat`
- This is what customers see in their browser address bar

✅ **Quick Tip**: When adding products, just enter the product name and you can leave both SKU and Slug empty if you want - the system will work fine. They are optional fields for advanced organization.