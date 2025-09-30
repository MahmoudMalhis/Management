# 📁 server/scripts/backup.sh (ملف جديد - Linux/Mac)
#!/bin/bash

# إعدادات قاعدة البيانات
DB_USER="root"
DB_PASS=
DB_NAME="company_management"
DB_HOST="localhost"

# مجلد النسخ الاحتياطية
BACKUP_DIR="/path/to/server/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# إنشاء المجلد إذا لم يكن موجود
mkdir -p $BACKUP_DIR

# عمل النسخة الاحتياطية
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_FILE

# ضغط النسخة
gzip $BACKUP_FILE

# حذف النسخ القديمة (أكثر من 30 يوم)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "✅ Backup completed: ${BACKUP_FILE}.gz"