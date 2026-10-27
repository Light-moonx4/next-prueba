import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Configura DIRECT_URL o DATABASE_URL antes de ejecutar el seed.');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPasswordAdmin = await bcrypt.hash('Admin123*', 10);
  const hashedPasswordUser = await bcrypt.hash('User123*', 10);

  // 1. Crear Administrador Demo
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cospace.com' },
    update: {},
    create: {
      email: 'admin@cospace.com',
      password: hashedPasswordAdmin,
      role: Role.ADMIN,
    },
  });
  console.log(`Administrador listo: ${admin.email}`);

  // 2. Crear Usuario Regular Demo (Opcional para pruebas)
  const customer = await prisma.user.upsert({
    where: { email: 'user@cospace.com' },
    update: {},
    create: {
      email: 'user@cospace.com',
      password: hashedPasswordUser,
      role: Role.USER,
    },
  });
  console.log(`Usuario estándar listo: ${customer.email}`);

  // 3. Crear Espacios de Prueba
  const spaces = [
    { name: 'Coworking Desk 1', nameEn: 'Coworking Desk 1', description: 'Escritorio individual', descriptionEn: 'Individual desk', pricePerHour: 15, type: 'desk' },
    { name: 'Sala de Juntas Alpha', nameEn: 'Alpha Meeting Room', description: 'Sala para 8 personas', descriptionEn: 'Meeting room for 8 people', pricePerHour: 45, type: 'meeting_room' },
    { name: 'Cabina Privada Zen', nameEn: 'Zen Private Booth', description: 'Cabina insonorizada', descriptionEn: 'Soundproof private booth', pricePerHour: 25, type: 'booth' },
  ];

  for (const space of spaces) {
    const existingSpace = await prisma.space.findFirst({ where: { name: space.name } });

    if (!existingSpace) {
      await prisma.space.create({ data: space });
    }
  }

  console.log('Espacios de prueba creados.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
