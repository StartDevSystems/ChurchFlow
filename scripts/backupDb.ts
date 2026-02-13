import fs from 'fs';
import { format } from 'date-fns';

const dbPath = './prisma/dev.db';
const backupDir = './prisma/backups';
const backupPath = `${backupDir}/backup-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.db`;

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

fs.copyFile(dbPath, backupPath, (err) => {
  if (err) {
    console.error('Error al hacer el backup de la base de datos:', err);
    return;
  }
  console.log(`Backup de la base de datos creado en: ${backupPath}`);
});
