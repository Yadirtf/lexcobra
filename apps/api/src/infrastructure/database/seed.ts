// ═══════════════════════════════════════════════════════════════
//  LexCobra — Seed de base de datos (Catálogos Esenciales)
//  Crea: Catálogos globales + Super Admin
// ═══════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de LexCobra (Catálogos Esenciales)...');

  // Helper para crear si no existe
  async function createIfNotExists(
    model: any,
    whereClause: any,
    data: any,
    successMsg?: string
  ) {
    const existing = await model.findFirst({ where: whereClause });
    if (!existing) {
      const created = await model.create({ data });
      if (successMsg) console.log(successMsg);
      return created;
    }
    return existing;
  }

  // ── 0. MÓDULO GEOGRÁFICO ─────────────────────────────────────
  const putumayo = await createIfNotExists(
    prisma.departamento,
    { nombre: 'Putumayo' },
    { nombre: 'Putumayo' }
  );

  const municipiosData = [
    'Mocoa', 'Puerto Asís', 'Villagarzón', 'Puerto Caicedo',
    'Orito', 'San Francisco', 'Sibundoy', 'Colón',
    'Santiago', 'San Miguel', 'Valle del Guamuez',
    'Puerto Guzmán', 'Leguízamo',
  ];

  let municipiosCreados = 0;
  for (const mun of municipiosData) {
    const existingMun = await prisma.municipio.findFirst({
      where: { departamentoId: putumayo.id, nombre: mun },
    });
    if (!existingMun) {
      await prisma.municipio.create({
        data: { departamentoId: putumayo.id, nombre: mun },
      });
      municipiosCreados++;
    }
  }
  if (municipiosCreados > 0) {
    console.log(`✅ ${municipiosCreados} municipios de Putumayo creados`);
  }

  // ── 1. PLANES DE SUSCRIPCIÓN ─────────────────────────────────
  const planes = [
    {
      nombre: 'Starter',
      descripcion: 'Plan básico para iniciar',
      precio: 200000,
      duracionMeses: 6,
      limitUsuarios: 3,
      activo: true,
    },
    {
      nombre: 'Profesional',
      descripcion: 'Plan profesional para casas de cobranza medianas',
      precio: 500000,
      duracionMeses: 12,
      limitUsuarios: 10,
      activo: true,
    },
    {
      nombre: 'Enterprise',
      descripcion: 'Plan empresarial con todas las funcionalidades',
      precio: 1200000,
      duracionMeses: 12,
      limitUsuarios: 50,
      activo: true,
    },
  ];

  for (const plan of planes) {
    await createIfNotExists(prisma.plan, { nombre: plan.nombre }, plan);
  }
  console.log('✅ Planes de suscripción verificados/creados');

  // ── ESTADOS DE CLIENTE ───────────────────────────────────────
  await createIfNotExists(prisma.estadoCliente, { estado: 'Activo' }, { estado: 'Activo', descripcion: 'Cliente activo en la plataforma' });
  await createIfNotExists(prisma.estadoCliente, { estado: 'Inactivo' }, { estado: 'Inactivo', descripcion: 'Cliente inactivo' });
  console.log('✅ Estados de cliente verificados/creados');

  // ── ESTADOS DE SUSCRIPCIÓN ───────────────────────────────────
  await createIfNotExists(prisma.estadoSuscripcion, { estado: 'Activa' }, { estado: 'Activa', descripcion: 'Suscripción activa' });
  await createIfNotExists(prisma.estadoSuscripcion, { estado: 'Suspendida' }, { estado: 'Suspendida', descripcion: 'Suscripción suspendida por falta de pago' });
  await createIfNotExists(prisma.estadoSuscripcion, { estado: 'Vencida' }, { estado: 'Vencida', descripcion: 'Suscripción vencida' });
  await createIfNotExists(prisma.estadoSuscripcion, { estado: 'Demo' }, { estado: 'Demo', descripcion: 'Período de demostración' });
  console.log('✅ Estados de suscripción verificados/creados');

  // ── 2. ROLES DEL SISTEMA ─────────────────────────────────────
  const rolDueno = await createIfNotExists(prisma.rol, { nombreRol: 'Dueño del sistema' }, { nombreRol: 'Dueño del sistema', descripcion: 'Administrador general de la plataforma (Super Admin)' });
  const rolAdmin = await createIfNotExists(prisma.rol, { nombreRol: 'Administrador' }, { nombreRol: 'Administrador', descripcion: 'Cliente administrador (Representante Legal)' });
  const rolUsuario = await createIfNotExists(prisma.rol, { nombreRol: 'Usuario' }, { nombreRol: 'Usuario', descripcion: 'Empleado del cliente con acceso al sistema' });
  console.log('✅ Roles del sistema verificados/creados');

  // ── 3. TIPOS DE IDENTIFICACIÓN ───────────────────────────────
  await createIfNotExists(prisma.tipoIdentificacion, { codigo: 'CC' }, { codigo: 'CC', nombre: 'Cédula de Ciudadanía' });
  await createIfNotExists(prisma.tipoIdentificacion, { codigo: 'CE' }, { codigo: 'CE', nombre: 'Cédula de Extranjería' });
  await createIfNotExists(prisma.tipoIdentificacion, { codigo: 'NIT' }, { codigo: 'NIT', nombre: 'Número de Identificación Tributaria' });
  await createIfNotExists(prisma.tipoIdentificacion, { codigo: 'PAP' }, { codigo: 'PAP', nombre: 'Pasaporte' });
  console.log('✅ Tipos de identificación verificados/creados');

  // ── 4. TIPOS DE CONTACTO ─────────────────────────────────────
  await createIfNotExists(prisma.tipoContacto, { nombre: 'Teléfono' }, { nombre: 'Teléfono' });
  await createIfNotExists(prisma.tipoContacto, { nombre: 'Celular' }, { nombre: 'Celular' });
  await createIfNotExists(prisma.tipoContacto, { nombre: 'Correo' }, { nombre: 'Correo' });
  console.log('✅ Tipos de contacto verificados/creados');

  // ── 5. ROLES DE ACTORES ──────────────────────────────────────
  await createIfNotExists(prisma.rolActor, { nombreRol: 'Deudor Principal' }, { nombreRol: 'Deudor Principal' });
  await createIfNotExists(prisma.rolActor, { nombreRol: 'Deudor Solidario' }, { nombreRol: 'Deudor Solidario' });
  await createIfNotExists(prisma.rolActor, { nombreRol: 'Codeudor' }, { nombreRol: 'Codeudor' });
  console.log('✅ Roles de actores verificados/creados');

  // ── 6. CATÁLOGOS DE PROCESO ──────────────────────────────────
  const estadosObligacion = [
    { nombre: 'TERMINADO', color: '#10b981' },
    { nombre: 'PERSUASIVO', color: '#f59e0b' },
    { nombre: 'AVALÚO INMUEBLE', color: '#0e94c2' },
    { nombre: 'AVALÚO ESTABLECIMIENTO', color: '#0e94c2' },
    { nombre: 'TRÁMITE PROCESAL', color: '#818cf8' },
    { nombre: 'INMOVILIZACIÓN', color: '#f87171' },
    { nombre: 'MEDIDA REGISTRADA', color: '#fb923c' },
    { nombre: 'NOTIFICACIÓN', color: '#34d399' },
    { nombre: 'MANDAMIENTO DE PAGO', color: '#60a5fa' },
    { nombre: 'SEGUIR ADELANTE', color: '#a78bfa' },
    { nombre: 'ADMISIÓN DEMANDA', color: '#34d399' },
    { nombre: 'INADMITE DEMANDA', color: '#f87171' },
    { nombre: 'SUBSANA DEMANDA', color: '#fcd34d' },
    { nombre: 'SECUESTRO', color: '#f05252' },
    { nombre: 'TÍTULOS JUDICIALES', color: '#818cf8' },
    { nombre: 'INSCRIPCIÓN MEDIDA', color: '#38bdf8' },
    { nombre: 'REMATE', color: '#ef4444' },
    { nombre: 'ACUERDO DE PAGO', color: '#10b981' },
    { nombre: 'EN LIQUIDACIÓN', color: '#a78bfa' },
    { nombre: 'EN ACTUALIZACIÓN LIQUIDACIÓN', color: '#fb923c' },
  ];

  for (const estado of estadosObligacion) {
    await createIfNotExists(prisma.estadoObligacion, { nombre: estado.nombre }, estado);
  }
  console.log(`✅ Estados de obligación verificados/creados`);

  const medidasCautelares = [
    'EMBARGO Y SECUESTRO',
    'EMBARGO Y RETENCIÓN',
    'SOLO EMBARGO',
    'SECUESTRO DE BIENES INMUEBLES',
    'INMOVILIZACIÓN DE VEHÍCULO',
    'NINGUNA',
  ];

  for (const medida of medidasCautelares) {
    await createIfNotExists(prisma.medidaCautelar, { nombre: medida }, { nombre: medida });
  }
  console.log(`✅ Medidas cautelares verificadas/creadas`);

  const nivelesRecuperacion = [
    { nombre: 'ALTO', color: '#10b981' },
    { nombre: 'MEDIO', color: '#f59e0b' },
    { nombre: 'BAJO', color: '#f87171' },
  ];

  for (const nivel of nivelesRecuperacion) {
    await createIfNotExists(prisma.nivelRecuperacion, { nombre: nivel.nombre }, nivel);
  }
  console.log(`✅ Niveles de recuperación verificados/creados`);

  // ── CARGOS ───────────────────────────────────────────────────
  await createIfNotExists(prisma.cargo, { nombreCargo: 'Abogado' }, { nombreCargo: 'Abogado', descripcion: 'Profesional en derecho' });
  await createIfNotExists(prisma.cargo, { nombreCargo: 'Asesor de cobranzas' }, { nombreCargo: 'Asesor de cobranzas', descripcion: 'Asesor de gestión de cartera' });
  await createIfNotExists(prisma.cargo, { nombreCargo: 'Secretaria' }, { nombreCargo: 'Secretaria', descripcion: 'Asistente administrativa' });
  console.log('✅ Cargos iniciales verificados/creados');

  // ── 9. SUPER ADMIN (sin clienteId) ───────────────────────────
  const adminEmail = 'admin@lexcobra.app';
  const superAdmin = await prisma.usuario.findFirst({
    where: { correo: adminEmail, clienteId: null },
  });

  if (!superAdmin) {
    const superAdminPassword = await bcrypt.hash('Admin@LexCobra2025!', 12);
    const createdAdmin = await prisma.usuario.create({
      data: {
        correo: adminEmail,
        contrasena: superAdminPassword,
        activo: true,
        clienteId: null,
      },
    });

    await prisma.usuarioRol.create({
      data: { usuarioId: createdAdmin.id, rolId: rolDueno.id },
    });
    console.log(`✅ Super Admin creado: ${adminEmail}`);
  } else {
    console.log(`✅ Super Admin verificado: ${adminEmail}`);
  }

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📋 Credenciales de acceso:');
  console.log('  Super Admin:     admin@lexcobra.app / Admin@LexCobra2025!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

