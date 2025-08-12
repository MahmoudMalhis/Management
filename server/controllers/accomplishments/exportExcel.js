const ExcelJS = require("exceljs");
const { Accomplishment, User, Op } = require("../../models");

module.exports = async function exportAccomplishments(req, res) {
  try {
    const where = {};
    if (req.query.employee) where.employee = req.query.employee;

    // اجعل endDate شاملًا لنهاية اليوم
    const toEndOfDay = (d) => {
      const x = new Date(d);
      x.setHours(23, 59, 59, 999);
      return x;
    };

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
        { model: User, as: "employeeInfo", attributes: ["_id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Accomplishments");

    worksheet.columns = [
      { header: "التاريخ", key: "date", width: 15 },
      { header: "اسم الموظف", key: "employeeName", width: 20 },
      { header: "تفاصيل المهمة", key: "description", width: 50 },
      { header: "الحالة", key: "status", width: 20 },
      { header: "عدد الملفات", key: "filesCount", width: 15 },
      { header: "عدد التعليقات", key: "commentsCount", width: 15 },
    ];

    accomplishments.forEach((acc) => {
      worksheet.addRow({
        date: acc.createdAt ? acc.createdAt.toISOString().split("T")[0] : "",
        employeeName: acc.employeeInfo ? acc.employeeInfo.name : "",
        description: acc.description || "",
        status: acc.status || "",
        filesCount: Array.isArray(acc.files) ? acc.files.length : 0,
        commentsCount: Array.isArray(acc.comments) ? acc.comments.length : 0,
      });
    });

    worksheet.getRow(1).font = { bold: true };

    const fileName = `accomplishments_export_${Date.now()}.xlsx`;

    // رؤوس التحميل
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    // ابثّ الملف مباشرة للمتصفح بدون حفظ
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
