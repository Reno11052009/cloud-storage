import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }
  
  const host = process.env.DB_HOST || 'localhost'
  const port = process.env.DB_PORT || 3306
  const database = process.env.DB_DATABASE || 'cloud_storage'
  const username = process.env.DB_USERNAME || 'root'
  const password = process.env.DB_PASSWORD || ''
  
  return `mysql://${username}:${password}@${host}:${port}/${database}`
}

export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl()
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma