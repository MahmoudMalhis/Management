import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Accomplishment, Employee, AccomplishmentFilters } from "@/types";
import { ROUTES } from "@/constants";
import { authAPI, accomplishmentsAPI } from "@/api/api";
import { useAuth } from "@/contexts/AuthContext";
import { showErrorToast } from "@/utils/errorHandler";
import { useAsyncState } from "@/hooks/useAsyncState";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LucidePlus,
  LucideLoader,
  LucideFileText,
  LucideFilter,
  LucideX,
  LucideDownload,
  LucideAlertCircle,
} from "lucide-react";

interface AccomplishmentDisplayData extends Accomplishment {
  employeeInfo: {
    _id: string;
    name: string;
  };
  taskTitleInfo: {
    _id: string;
    name: string;
  };
}

const AccomplishmentCard: React.FC<{
  accomplishment: AccomplishmentDisplayData;
  isManager: boolean;
  t: any;
}> = ({ accomplishment, isManager, t }) => {
  const formattedDate = useMemo(() => {
    return new Date(accomplishment.createdAt).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [accomplishment.createdAt]);
  const getStatusStyles = (status: string) => {
    const styles = {
      reviewed:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      needs_modification:
        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      pending:
        "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
      assigned: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    };
    return styles[status] || styles.pending;
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      reviewed: t("accomplishments.reviewed"),
      needs_modification: t("accomplishments.needsModification"),
      pending: t("accomplishments.notReviewed"),
      assigned: t("accomplishments.assigned") || "مُكلف",
    };
    return statusMap[status] || statusMap.pending;
  };

  return (
    <Card className="glass-card glass-card-hover border-none md:w-[32%] w-full">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-lg glassy-text flex justify-between items-start">
          <span className="text-muted-foreground text-sm">{formattedDate}</span>
          <span className="capitalize font-bold text-center flex-1">
            {accomplishment.taskTitleInfo?.name || "غير محدد"}
          </span>
          {isManager && (
            <span className="capitalize font-bold text-right">
              {accomplishment.employeeInfo?.name}
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <Link to={`${ROUTES.ACCOMPLISHMENTS}/${accomplishment._id}`}>
        <CardDescription className="p-3 border-y border-[#aac8f0] h-20 bg-[#d5e2f9] overflow-hidden">
          {accomplishment.description.length > 100
            ? `${accomplishment.description.substring(0, 100)}...`
            : accomplishment.description}
        </CardDescription>

        <div
          className={`font-[calibri] font-bold px-2 py-1 self-start rounded-b-xl mx-auto ${getStatusStyles(
            accomplishment.status
          )}`}
        >
          <CardContent className="p-1">
            <div className="flex justify-between md:flex-row flex-col items-center gap-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <LucideFileText className="h-3 w-3 mr-1" />
                {accomplishment.files?.length || 0}{" "}
                {t("accomplishments.files").toLowerCase()}
              </div>

              <div className="flex items-center text-sm text-muted-foreground">
                {accomplishment.comments?.length || 0}{" "}
                {t("accomplishments.comments").toLowerCase()}
              </div>

              <div className="px-2 py-1 rounded-xl bg-white/50">
                {getStatusText(accomplishment.status)}
              </div>
            </div>
          </CardContent>
        </div>
      </Link>
    </Card>
  );
};

const FiltersCard: React.FC<{
  showFilters: boolean;
  onClose: () => void;
  filters: AccomplishmentFilters;
  onFiltersChange: (filters: AccomplishmentFilters) => void;
  employees: Employee[];
  isManager: boolean;
  t: any;
}> = ({
  showFilters,
  onClose,
  filters,
  onFiltersChange,
  employees,
  isManager,
  t,
}) => {
  if (!showFilters) return null;

  const handleEmployeeChange = (employeeId: string) => {
    onFiltersChange({
      ...filters,
      employee: employeeId === "all" ? undefined : employeeId,
    });
  };

  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value || undefined,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <Card className="glass-card glass-card-hover border-none mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base glassy-text">
            {t("accomplishments.filter")}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="glass-btn h-8 w-8 p-0"
            onClick={onClose}
          >
            <LucideX className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isManager && (
            <div className="space-y-1">
              <Label htmlFor="employee">
                {t("accomplishments.filterByEmployee")}
              </Label>
              <Select
                value={filters.employee || "all"}
                onValueChange={handleEmployeeChange}
              >
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder={t("employees.select")} />
                </SelectTrigger>
                <SelectContent className="glass-dropdown">
                  <SelectItem value="all">جميع الموظفين</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem
                      key={employee._id}
                      value={employee._id}
                      className="capitalize"
                    >
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="startDate">{t("accomplishments.startDate")}</Label>
            <Input
              id="startDate"
              type="date"
              className="glass-input"
              value={filters.startDate || ""}
              onChange={(e) => handleDateChange("startDate", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="endDate">{t("accomplishments.endDate")}</Label>
            <Input
              id="endDate"
              type="date"
              className="glass-input"
              value={filters.endDate || ""}
              onChange={(e) => handleDateChange("endDate", e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-between mt-4">
          <Button variant="ghost" className="glass-btn" onClick={clearFilters}>
            {t("accomplishments.clearFilter")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const AccomplishmentsList: React.FC = () => {
  const { t } = useTranslation();
  const { isManager } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    data: accomplishments,
    loading,
    error,
    execute: fetchAccomplishments,
    setError,
  } = useAsyncState<AccomplishmentDisplayData[]>();

  const { data: employees, execute: fetchEmployees } =
    useAsyncState<Employee[]>();

  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState<AccomplishmentFilters>({});

  const urlParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      employeeId: params.get("employee") || "",
      status: params.get("status") || "",
    };
  }, [location.search]);

  useEffect(() => {
    const newFilters: AccomplishmentFilters = {};

    if (urlParams.employeeId && urlParams.employeeId !== "all") {
      newFilters.employee = urlParams.employeeId;
    }

    if (urlParams.status) {
      newFilters.status = urlParams.status;
    }

    setFilters(newFilters);
  }, [urlParams]);

  useEffect(() => {
    if (isManager) {
      fetchEmployees(async () => {
        const response = await authAPI.getEmployees({ status: "active" });
        return response.data || [];
      });
    }
  }, [isManager, fetchEmployees]);

  useEffect(() => {
    console.log("employees updated: ", employees);
  }, [employees]);

  useEffect(() => {
    fetchAccomplishments(async () => {
      const response = await accomplishmentsAPI.getAccomplishments(filters);

      const accomplishments = Array.isArray(response)
        ? response
        : response?.data || [];

      return accomplishments.map((acc: Accomplishment) => ({
        ...acc,
        employeeInfo: acc.employeeInfo ?? { _id: "", name: "" },
        taskTitleInfo: acc.taskTitleInfo ?? { _id: "", name: "غير محدد" },
      }));
    });
  }, [filters, fetchAccomplishments]);

  const handleExport = useCallback(async () => {
    try {
      setExporting(true);

      const response = await accomplishmentsAPI.exportAccomplishments(filters);

      const contentType = response.headers["content-type"];
      if (contentType && contentType.includes("application/json")) {
        throw new Error("فشل في تصدير البيانات");
      }

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `accomplishments_export_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("تم تصدير البيانات بنجاح");
    } catch (error) {
      showErrorToast(error, "فشل في تصدير البيانات");
    } finally {
      setExporting(false);
    }
  }, [filters]);

  const updateUrlWithFilters = useCallback(
    (newFilters: AccomplishmentFilters) => {
      const searchParams = new URLSearchParams();

      if (newFilters.employee) {
        searchParams.set("employee", newFilters.employee);
      }

      if (newFilters.status) {
        searchParams.set("status", newFilters.status);
      }

      const newUrl = searchParams.toString()
        ? `${ROUTES.ACCOMPLISHMENTS}?${searchParams.toString()}`
        : ROUTES.ACCOMPLISHMENTS;

      navigate(newUrl, { replace: true });
    },
    [navigate]
  );

  const handleFiltersChange = useCallback(
    (newFilters: AccomplishmentFilters) => {
      setFilters(newFilters);
      updateUrlWithFilters(newFilters);
    },
    [updateUrlWithFilters]
  );

  const filteredAccomplishments = useMemo(() => {
    if (!accomplishments) return [];

    if (urlParams.status === "notReviewed") {
      return accomplishments.filter((acc) => acc.status !== "reviewed");
    }

    return accomplishments;
  }, [accomplishments, urlParams.status]);

  if (loading && !accomplishments) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <LucideLoader className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Card className="glass-card border-red-200">
          <CardContent className="p-6 text-center">
            <LucideAlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              onClick={() => {
                setError(null);
                fetchAccomplishments(async () => {
                  const response = await accomplishmentsAPI.getAccomplishments(
                    filters
                  );
                  return response.data || [];
                });
              }}
              className="glass-btn"
            >
              المحاولة مرة أخرى
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen p-6 bg-gradient-to-br from-[#d1e9ff] via-[#f2f8fc] to-[#b6d2f8]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight glassy-text">
          {t("accomplishments.title")}
        </h1>

        <div className="flex gap-2">
          {isManager && (
            <Button
              className="glass-btn flex items-center gap-1"
              disabled={exporting}
              onClick={handleExport}
            >
              {exporting ? (
                <>
                  <LucideLoader className="h-4 w-4 animate-spin" />
                  {t("accomplishments.exporting")}
                </>
              ) : (
                <>
                  <LucideDownload className="h-4 w-4" />
                  {t("accomplishments.export")}
                </>
              )}
            </Button>
          )}

          <Button
            className="glass-btn flex items-center gap-1"
            onClick={() => setShowFilters(!showFilters)}
          >
            <LucideFilter className="h-4 w-4" />
            {t("accomplishments.filter")}
          </Button>

          {!isManager && (
            <Link to={ROUTES.ACCOMPLISHMENTS_ADD}>
              <Button className="glass-btn flex items-center gap-1">
                <LucidePlus className="h-4 w-4" />
                {t("accomplishments.add")}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <FiltersCard
        showFilters={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        employees={employees || []}
        isManager={isManager}
        t={t}
      />

      {/* Accomplishments Grid */}
      <div className="flex flex-wrap justify-center gap-3 mx-auto">
        {filteredAccomplishments.length > 0 ? (
          filteredAccomplishments.map((accomplishment) => (
            <AccomplishmentCard
              key={accomplishment._id}
              accomplishment={accomplishment}
              isManager={isManager}
              t={t}
            />
          ))
        ) : (
          <Card className="glass-card border-none">
            <CardContent className="py-8 text-center text-muted-foreground">
              <p className="mb-4">{t("accomplishments.noAccomplishments")}</p>
              {!isManager && (
                <Link to={ROUTES.ACCOMPLISHMENTS_ADD}>
                  <Button className="glass-btn">
                    {t("accomplishments.add")}
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AccomplishmentsList;
