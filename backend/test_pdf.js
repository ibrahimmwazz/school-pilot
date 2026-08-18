const { FormMasterService } = require('./dist/services/form-master.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPdf() {
  const activeTerm = await prisma.academicTerm.findFirst({ where: { isActive: true } });
  const classObj = await prisma.class.findFirst();
  const staff = await prisma.user.findFirst({ where: { role: 'TEACHER' } });

  console.log('Testing PDF generation for class', classObj.name, classObj.arm);
  
  await FormMasterService.lockClass(classObj.id, activeTerm.id, staff.id);
  console.log("Success");
  
  prisma.$disconnect();
}

testPdf().catch(console.error);
