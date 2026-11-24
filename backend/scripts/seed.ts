import { db, migrate } from '../src/config/db.js';
import { hashPassword } from '../src/common/auth.js';
import { ensureDefaultSettings } from '../src/common/settings.js';
import { env } from '../src/config/env.js';

migrate();
ensureDefaultSettings();

async function seed(): Promise<void> {
  const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(env.adminUsername);
  if (!existing) {
    db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(
      env.adminUsername,
      await hashPassword(env.adminPassword),
    );
    console.log(`✔ Administrador creado: ${env.adminUsername}`);
  } else {
    console.log('• El administrador ya existe, se conservó');
  }

  const prizeCount = (db.prepare('SELECT COUNT(*) AS count FROM prizes').get() as { count: number }).count;
  if (prizeCount === 0) {
    const insert = db.prepare(`
      INSERT INTO prizes (
        name, description, icon, color, probability, quantity, is_unlimited, delivered,
        active, is_consolation, position, result_title, result_message, result_description,
        claim_instructions, expires_at, whatsapp_button_text
      ) VALUES (
        @name, @description, @icon, @color, @probability, @quantity, @is_unlimited, 0,
        1, @is_consolation, @position, @result_title, @result_message, @result_description,
        @claim_instructions, @expires_at, @whatsapp_button_text
      )
    `);

    const seedPrizes = [
      {
        name: '1 Cortesía',
        description: 'Entrada gratuita para ti y un acompañante.',
        icon: '🎟️', color: '#a855f7', probability: 5, quantity: 1, is_unlimited: 0,
        is_consolation: 0, position: 0, result_title: '¡FELICIDADES!',
        result_message: 'Te has ganado una cortesía para nuestra próxima noche de fiesta. ¡Te esperamos!',
        result_description: 'Válida para una entrada + acompañante.',
        claim_instructions: 'Presenta tu código en la entrada del club.',
        expires_at: '30 días', whatsapp_button_text: 'RESERVAR POR WHATSAPP',
      },
      {
        name: 'Descuento 20%',
        description: '20% de descuento en tu reserva.',
        icon: '💎', color: '#ec4899', probability: 15, quantity: 2, is_unlimited: 0,
        is_consolation: 0, position: 1, result_title: '¡LO LOGRASTE!',
        result_message: 'Has ganado un descuento especial del 20% para disfrutar de nuestra fiesta.',
        result_description: 'Aplicable sobre el valor de la reserva.',
        claim_instructions: 'Menciona tu código al reservar.',
        expires_at: '15 días', whatsapp_button_text: 'RESERVAR CON 20% DTO.',
      },
      {
        name: 'Descuento 10%',
        description: '10% de descuento en tu reserva.',
        icon: '✨', color: '#06b6d4', probability: 30, quantity: 5, is_unlimited: 0,
        is_consolation: 0, position: 2, result_title: '¡BUENA SUERTE!',
        result_message: 'Has ganado un descuento del 10% para tu próxima visita.',
        result_description: 'Aplicable sobre el valor de la reserva.',
        claim_instructions: 'Menciona tu código al reservar.',
        expires_at: '15 días', whatsapp_button_text: 'RESERVAR CON 10% DTO.',
      },
      {
        name: 'Promo especial',
        description: 'Promoción sorpresa de la casa.',
        icon: '🎉', color: '#f59e0b', probability: 10, quantity: 5, is_unlimited: 0,
        is_consolation: 0, position: 3, result_title: '¡PROMO ESPECIAL!',
        result_message: 'Ganaste una promoción especial. Te contactaremos por WhatsApp.',
        result_description: 'Sorpresa de la casa.',
        claim_instructions: 'Escríbenos con tu código para conocer tu premio.',
        expires_at: '7 días', whatsapp_button_text: 'RECLAMAR PROMO',
      },
      {
        name: 'Premio sorpresa',
        description: 'Un detalle sorpresa durante la noche.',
        icon: '🎁', color: '#22c55e', probability: 10, quantity: 10, is_unlimited: 0,
        is_consolation: 0, position: 4, result_title: '¡SORPRESA!',
        result_message: 'Tienes un premio sorpresa esperándote en el club.',
        result_description: 'Reclamo sorpresa en taquilla.',
        claim_instructions: 'Presenta tu código en taquilla.',
        expires_at: '7 días', whatsapp_button_text: 'CONOCER MI PREMIO',
      },
      {
        name: 'Sigue participando',
        description: 'No ganaste esta vez, pero puedes volver a intentarlo.',
        icon: '🔁', color: '#475569', probability: 30, quantity: 0, is_unlimited: 1,
        is_consolation: 1, position: 5, result_title: '¡SIGUE PARTICIPANDO!',
        result_message: 'Esta vez no hubo premio, pero la suerte puede cambiar. ¡Vuelve a girar!',
        result_description: 'Podrás volver a participar según las condiciones de la promoción.',
        claim_instructions: '', expires_at: '', whatsapp_button_text: 'VOLVER A INTENTAR',
      },
    ];

    for (const prize of seedPrizes) insert.run(prize);
    console.log(`✔ ${seedPrizes.length} premios iniciales creados`);
  } else {
    console.log('• Ya existen premios, se conservaron');
  }
}

await seed();
console.log('✔ Seed finalizado');
