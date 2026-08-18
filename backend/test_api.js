const fetch = require('node-fetch');

async function test() {
  // we don't have token but we can bypass auth by making a minimal prisma query 
  // mirroring the GET /classes/directory exactly
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  const activeTerm = await prisma.academicTerm.findFirst({ where: { isActive: true } });
  console.log("ACTIVE TERM:", activeTerm.id);

  const classes = await prisma.class.findMany({
    where: { 
      OR: [
        { name: { startsWith: 'JSS', mode: 'insensitive' } },
        { name: { startsWith: 'SSS', mode: 'insensitive' } }
      ]
    },
    include: {
      _count: {
        select: {
          enrollments: { where: { academicTermId: activeTerm.id } }
        }
      }
    },
    orderBy: [{ name: 'asc' }, { arm: 'asc' }]
  });

  console.log("CLASSES:", classes.map(c => `${c.name} ${c.arm}: ${c._count.enrollments} enrollments`));
  prisma.$disconnect();
}

test().catch(console.error);
