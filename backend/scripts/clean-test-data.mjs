import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

const db = new DatabaseSync(path.resolve('data/ruleta.db'));
db.exec('DELETE FROM participations');
db.exec("UPDATE prizes SET delivered = 0");
db.exec("DELETE FROM audit_logs WHERE action = 'GIRO'");
console.log('Datos de prueba eliminados');
