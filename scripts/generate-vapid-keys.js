#!/usr/bin/env node
// scripts/generate-vapid-keys.js
//
// Run ONCE: node scripts/generate-vapid-keys.js
// Copy the output into your .env.local and Vercel env vars.
// Never run again — changing keys breaks existing subscriptions.

const webpush = require('web-push')

const keys = webpush.generateVAPIDKeys()

console.log('\n✅ VAPID keys generated — add these to .env.local and Vercel:\n')
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
console.log(`VAPID_SUBJECT=mailto:your@email.com`)
console.log('\n⚠️  Keep VAPID_PRIVATE_KEY secret — never commit to git.\n')
