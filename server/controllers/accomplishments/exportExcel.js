const ExcelJS = require("exceljs");
const { Accomplishment, User, Op } = require("../../models");

module.exports = async function exportAccomplishments(req, res, next) {
  // ✅ إضافة next
  try {
    const where = {};
    if (req.query.employee) where.employee = req.query.employee;

    // ✅ دالة موحدة لجعل التاريخ شاملاً لنهاية اليوم
    const toEndOfDay = (dateString) => {
      const date = new Date(dateString);
      date.setHours(23, 59, 59, 999);
      return date;
    };

    // ✅ فلترة التواريخ بطريقة محسّنة
    if (req.query.startDate && req.query.endDate) {
      where.createdAt = {
        [Op.gte]: new Date(req.query.startDate),
        [Op.lte]: toEndOfDay(req.query.endDate),
      };
    } else if (req.query.startDate) {
      where.createdAt = { [Op.gte]: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      where.createdAt = { [Op.lte]: toEndOfDay(req.query.endDate) };
    }

    const accomplishments = await Accomplishment.findAll({
      where,
      include: [
        {
          model: User,
          as: "employeeInfo",
          attributes: ["_id", "name", "role"], // ✅ إضافة role للثبات
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Accomplishments");

    // ✅ تحديد أعمدة الجدول بطريقة أوضح
    worksheet.columns = [
      { header: "التاريخ", key: "date", width: 15 },
      { header: "اسم الموظف", key: "employeeName", width: 20 },
      { header: "تفاصيل المهمة", key: "description", width: 50 },
      { header: "الحالة", key: "status", width: 20 },
      { header: "عدد الملفات", key: "filesCount", width: 15 },
      { header: "عدد التعليقات", key: "commentsCount", width: 15 },
    ];

    // ✅ إضافة البيانات للجدول مع معالجة أفضل للقيم الفارغة
    accomplishments.forEach((accomplishment) => {
      worksheet.addRow({
        date: accomplishment.createdAt
          ? accomplishment.createdAt.toISOString().split("T")[0]
          : "غير محدد",
        employeeName: accomplishment.employeeInfo
          ? accomplishment.employeeInfo.name
          : "غير محدد",
        description: accomplishment.description || "لا توجد تفاصيل",
        status: accomplishment.status || "غير محدد",
        filesCount: Array.isArray(accomplishment.files)
          ? accomplishment.files.length
          : 0,
        commentsCount: Array.isArray(accomplishment.comments)
          ? accomplishment.comments.length
          : 0,
      });
    });

    // ✅ تنسيق رأس الجدول
    worksheet.getRow(1).font = { bold: true };

    // ✅ إنشاء اسم ملف فريد ومعرف
    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `accomplishments_export_${timestamp}.xlsx`;

    // ✅ تحديد رؤوس الاستجابة بطريقة صحيحة
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    // ✅ إرسال الملف مباشرة للمتصفح
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    // ✅ استخدام معالج الأخطاء الموحد
    next(err);
  }
};
