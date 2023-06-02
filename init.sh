#!/usr/bin/env sh

cd source
npx prisma generate
npm run dev 
