/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authAPI, accomplishmentsAPI, comparisonsAPI } from "@/api/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LucideArrowLeft, LucideLoader, LucideFileText } from "lucide-react";
import { toast } from "sonner";
import Popup from "@/components/Popup";

interface Employee {
  _id: string;
  name: string;
}

interface File {
  _id: string;
  fileName: string;
  filePath: string;
  fileType: string;
}

interface Comment {
  _id: string;
  text: string;
  createdAt: string;
  commentedBy: {
    _id: string;
    name: string;
    role: string;
  };
}

interface Accomplishment {
  _id: string;
  description: string;
  status: string;
  createdAt: string;
  originalDescription: string;
  files: File[];
  comments: Comment[];
  taskTitleInfo: { name: string };
}

interface EmployeeData {
  employee: Employee;
  accomplishments: Accomplishment[];
  loading: boolean;
}

// أعلى الملف (مع بقية الـ imports)
type QuickRange = "all" | "week" | "month" | "year" | "custom";

const CompareEmployees = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Get employee IDs from URL params
  const params = new URLSearchParams(location.search);
  const idsParam = params.get("ids");
  const [selectedIds, setSelectedIds] = useState<string[]>(
    idsParam ? idsParam.split(",") : []
  );

  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [employeesData, setEmployeesData] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<QuickRange>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [saveOpen, setSaveOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  function toISO(date: Date) {
    // YYYY-MM-DD
    return date.toISOString().split("T")[0];
  }
  function addDays(date: Date, days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  // Fetch all employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await authAPI.getEmployees();
        const raw = response.data || response;
        setAllEmployees(
          (raw || []).map((e: any) => ({
            _id: String(e._id),
            name: e.name,
          }))
        );
      } catch (err) {
        console.error("Error fetching employees:", err);
        setError(t("employees.loadFailed"));
      }
    };

    fetchEmployees();
  }, [t]);

  // Fetch accomplishments for selected employees
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (selectedIds.length === 0) {
        setEmployeesData([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const newEmployeesData: EmployeeData[] = selectedIds.map((_id) => ({
          employee: {
            _id,
            name: "",
          },
          accomplishments: [],
          loading: true,
        }));

        setEmployeesData(newEmployeesData);

        const promises = selectedIds.map(async (id, index) => {
          try {
            const employeeDetails = allEmployees.find((emp) => emp._id === id);

            if (!employeeDetails) {
              throw new Error(`Employee with ID ${id} not found`);
            }

            const accomplishmentsResponse =
              await accomplishmentsAPI.getAccomplishments({
                employee: id,
                ...(startDate
                  ? { startDate: `${startDate}T00:00:00.000Z` }
                  : {}),
                ...(endDate ? { endDate: `${endDate}T23:59:59.999Z` } : {}),
              });

            return {
              index,
              employee: employeeDetails,
              accomplishments: accomplishmentsResponse.data || [],
            };
          } catch (err) {
            console.error(`Error fetching data for employee ${id}:`, err);
            return {
              index,
              employee: { _id: id, name: "Unknown" },
              accomplishments: [],
              error: err.message,
            };
          }
        });

        const results = await Promise.all(promises);

        const updatedEmployeesData = [...newEmployeesData];
        results.forEach((result) => {
          updatedEmployeesData[result.index] = {
            employee: result.employee,
            accomplishments: result.accomplishments,
            loading: false,
          };
        });

        setEmployeesData(updatedEmployeesData);
      } catch (err) {
        console.error("Error in comparison:", err);
        setError(err.message || t("common.error"));
      } finally {
        setLoading(false);
      }
    };

    if (allEmployees.length > 0 && selectedIds.length > 0) {
      fetchEmployeeData();
    }
  }, [selectedIds, allEmployees, t, startDate, endDate]);

  // Handle adding an employee to comparison
  const handleAddEmployee = (id: string) => {
    if (!selectedIds.includes(id)) {
      const newSelectedIds = [...selectedIds, id];
      setSelectedIds(newSelectedIds);

      const searchParams = new URLSearchParams();
      searchParams.set("ids", newSelectedIds.join(","));
      navigate(`/employees/compare?${searchParams.toString()}`);
    }
  };

  // Handle removing an employee from comparison
  const handleRemoveEmployee = (id: string) => {
    const newSelectedIds = selectedIds.filter(
      (employeeId) => employeeId !== id
    );
    setSelectedIds(newSelectedIds);

    if (newSelectedIds.length > 0) {
      const searchParams = new URLSearchParams();
      searchParams.set("ids", newSelectedIds.join(","));
      navigate(`/employees/compare?${searchParams.toString()}`);
    } else {
      navigate("/employees");
    }
  };

  // Format date function
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div>
      <Button
        variant="ghost"
        className="mb-4 flex items-center gap-1 glass-btn"
        onClick={() => navigate("/employees")}
      >
        <LucideArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight glassy-text">
          {t("employees.compare")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("employees.select")}</p>
      </div>

      {/* Add employee selector */}
      {allEmployees.length > 0 && selectedIds.length < 4 && (
        <Card className="mb-6 glass-card border-none">
          <CardContent className="py-6">
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="add-employee" className="glassy-text">
                  {t("employees.select")}
                </Label>
                <Select
                  onValueChange={(value) => {
                    handleAddEmployee(value);
                    // Reset the select after selection
                    const selectElement = document.getElementById(
                      "add-employee"
                    ) as HTMLSelectElement;
                    if (selectElement) {
                      selectElement.value = "";
                    }
                  }}
                >
                  <SelectTrigger
                    id="add-employee"
                    className={`glass-input ${
                      i18n.language === "ar"
                        ? "[direction:rtl]"
                        : "[direction:ltr]"
                    }`}
                  >
                    <SelectValue placeholder={t("employees.select")} />
                  </SelectTrigger>
                  <SelectContent className="glass-dropdown bg-white">
                    {allEmployees
                      .filter((employee) => !selectedIds.includes(employee._id))
                      .map((employee) => (
                        <SelectItem
                          key={employee._id}
                          value={employee._id}
                          className={`cursor-pointer  ${
                            i18n.language === "ar"
                              ? "[direction:rtl]"
                              : "[direction:ltr]"
                          }`}
                        >
                          {employee.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                className="glass-btn"
                onClick={() => navigate("/employees")}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center p-8">
          <LucideLoader className="h-8 w-8 animate-spin" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card className="glass-card border border-red-200">
          <CardContent className="flex items-center gap-2 py-6">
            <span className="text-red-600 dark:text-red-400">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Comparison view */}
      {!loading && !error && employeesData.length > 0 && (
        <div className="space-y-8">
          <Button
            className="glass-btn"
            onClick={() => setSaveOpen(true)}
            disabled={selectedIds.length === 0}
          >
            حفظ هذه المقارنة
          </Button>
          <Button
            variant="outline"
            className="glass-btn mr-3"
            onClick={() => navigate("/comparisons")}
          >
            المقارنات المحفوظة
          </Button>
          <Popup open={saveOpen} onClose={() => setSaveOpen(false)}>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold glassy-text">
                  حفظ المقارنة
                </h3>
              </div>

              <div className="space-y-3">
                <input
                  className="glass-input w-full p-2"
                  placeholder="اسم (اختياري)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <textarea
                  className="glass-input w-full min-h-[96px] p-2"
                  placeholder="ملاحظات"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  className="glass-btn px-4 py-2"
                  onClick={() => setSaveOpen(false)}
                >
                  إلغاء
                </button>
                <button
                  className="glass-btn px-4 py-2"
                  onClick={async (e) => {
                    e.preventDefault();
                    await comparisonsAPI.create({
                      name,
                      notes,
                      employeeIds: selectedIds,
                      range,
                      startDate: startDate || undefined,
                      endDate: endDate || undefined,
                    });
                    setSaveOpen(false);
                    toast.success("تم حفظ المقارنة");
                  }}
                >
                  حفظ
                </button>
              </div>
            </div>
          </Popup>{" "}
          <Card className="mb-4 glass-card border-none">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={range === "all" ? "default" : "outline"}
                  className="glass-btn"
                  onClick={() => {
                    setRange("all");
                    setStartDate("");
                    setEndDate("");
                  }}
                >
                  الكل
                </Button>
                <Button
                  variant={range === "week" ? "default" : "outline"}
                  className="glass-btn"
                  onClick={() => {
                    setRange("week");
                    const today = new Date();
                    setEndDate(toISO(today));
                    setStartDate(toISO(addDays(today, -7)));
                  }}
                >
                  أسبوع
                </Button>
                <Button
                  variant={range === "month" ? "default" : "outline"}
                  className="glass-btn"
                  onClick={() => {
                    setRange("month");
                    const today = new Date();
                    setEndDate(toISO(today));
                    setStartDate(toISO(addDays(today, -30)));
                  }}
                >
                  شهر
                </Button>
                <Button
                  variant={range === "year" ? "default" : "outline"}
                  className="glass-btn"
                  onClick={() => {
                    setRange("year");
                    const today = new Date();
                    setEndDate(toISO(today));
                    setStartDate(toISO(addDays(today, -365)));
                  }}
                >
                  سنة
                </Button>
                <div className="flex items-center gap-2 ml-auto">
                  <Label className="glassy-text text-sm">من</Label>
                  <input
                    type="date"
                    className="glass-input px-2 py-1"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setRange("custom");
                    }}
                  />
                  <Label className="glassy-text text-sm">إلى</Label>
                  <input
                    type="date"
                    className="glass-input px-2 py-1"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setRange("custom");
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Separator />
          {/* Employee headers */}
          <div className="overflow-x-scroll">
            <div className="flex gap-4">
              {employeesData.map((data) => (
                <Card
                  key={data.employee._id}
                  className="relative glass-card !w-52 min-w-[13rem] shrink-0 flex-none"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 glass-btn"
                    onClick={() => handleRemoveEmployee(data.employee._id)}
                  >
                    ×
                  </Button>
                  <CardHeader>
                    <CardTitle className="text-xl glassy-text capitalize">
                      {data.employee.name}
                    </CardTitle>
                    {/* يمكنك وضع أي إحصائيات أخرى هنا */}
                  </CardHeader>
                  <CardContent>
                    {data.loading ? (
                      <div className="flex justify-center p-4">
                        <LucideLoader className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      <div className="text-sm">
                        <div className="flex justify-between mb-2">
                          <span>{t("accomplishments.title")}:</span>
                          <span className="font-medium">
                            {data.accomplishments.length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("accomplishments.reviewed")}:</span>
                          <span className="font-medium">
                            {
                              data.accomplishments.filter(
                                (acc) => acc.status === "reviewed"
                              ).length
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("accomplishments.notReviewed")}:</span>
                          <span className="font-medium">
                            {
                              data.accomplishments.filter(
                                (acc) => acc.status === "notReviewed"
                              ).length
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("accomplishments.needsModification")}:</span>
                          <span className="font-medium">
                            {
                              data.accomplishments.filter(
                                (acc) => acc.status === "needsModification"
                              ).length
                            }
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex gap-4 my-3 over">
              {employeesData.map((empData, index) => {
                const sorted = [...empData.accomplishments].sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                );

                return (
                  <div
                    key={empData.employee._id || index}
                    className="space-y-4"
                  >
                    {sorted.length > 0 ? (
                      sorted.map((acc) => {
                        const status =
                          typeof acc.status === "string"
                            ? acc.status
                            : acc.status === true
                            ? "reviewed"
                            : "pending";

                        const text =
                          (acc as any).originalDescription ||
                          acc.description ||
                          "";

                        return (
                          <Card
                            key={acc._id}
                            className="glass-card border-none w-52"
                          >
                            <Link to={`/accomplishments/${acc._id}`}>
                              <CardContent className="py-4 overflow-hidden">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs">
                                      {acc?.taskTitleInfo?.name}
                                    </span>
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs ${
                                        status === "reviewed"
                                          ? "bg-green-100 text-green-800"
                                          : status === "needs_modification"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-amber-100 text-amber-800"
                                      }`}
                                    >
                                      {status === "reviewed"
                                        ? t("accomplishments.reviewed")
                                        : status === "needs_modification"
                                        ? t("accomplishments.needsModification")
                                        : t("accomplishments.notReviewed")}
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                                    <span>
                                      {new Date(acc.createdAt).toLocaleString()}
                                    </span>
                                  </div>

                                  <p className="text-sm">
                                    {text.length > 100
                                      ? `${text.slice(0, 100)}...`
                                      : text}
                                  </p>

                                  {(acc.files?.length ?? 0) > 0 && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <LucideFileText className="h-3 w-3" />
                                      {acc.files.length}
                                      {t("accomplishments.files").toLowerCase()}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Link>
                          </Card>
                        );
                      })
                    ) : (
                      <div className="w-52 p-4 border border-dashed rounded-md text-center text-muted-foreground text-sm h-full flex items-center justify-center">
                        {t("accomplishments.noAccomplishments")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompareEmployees;
