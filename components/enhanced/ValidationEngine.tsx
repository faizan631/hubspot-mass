"use client";

import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lightbulb,
  Save,
} from "lucide-react";

interface ValidationEngineProps {
  user: User;
  fieldConfigs: any[];
  onValidationComplete: (isValid: boolean, suggestions: string[]) => void;
}

interface ValidationRule {
  field: string;
  rule_type: string;
  rule_value: any;
  error_message: string;
  severity: "error" | "warning" | "info";
}

interface ValidationResult {
  field: string;
  isValid: boolean;
  severity: "error" | "warning" | "info";
  message: string;
  suggestion?: string;
}

export default function ValidationEngine({
  user,
  fieldConfigs,
  onValidationComplete,
}: ValidationEngineProps) {
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([]);
  const [testValues, setTestValues] = useState<Record<string, any>>({});
  const [validationResults, setValidationResults] = useState<
    ValidationResult[]
  >([]);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const supabase = createClient();

  useEffect(() => {
    loadValidationRules();
    initializeTestValues();
  }, [fieldConfigs]);

  const loadValidationRules = async () => {
    try {
      const { data, error } = await supabase
        .from("field_configurations")
        .select("field_name, validation_rules")
        .eq("user_id", user.id);

      if (error) throw error;

      const rules: ValidationRule[] = [];
      data.forEach((field) => {
        if (
          field.validation_rules &&
          typeof field.validation_rules === "object"
        ) {
          Object.entries(field.validation_rules).forEach(
            ([ruleType, ruleValue]: [string, any]) => {
              rules.push({
                field: field.field_name,
                rule_type: ruleType,
                rule_value: ruleValue,
                error_message: getDefaultErrorMessage(
                  field.field_name,
                  ruleType,
                  ruleValue
                ),
                severity: getDangerousFields().includes(field.field_name)
                  ? "error"
                  : "warning",
              });
            }
          );
        }
      });

      // Add default SEO rules
      rules.push(
        {
          field: "htmlTitle",
          rule_type: "maxLength",
          rule_value: 60,
          error_message:
            "HTML title should be under 60 characters for optimal SEO",
          severity: "warning",
        },
        {
          field: "metaDescription",
          rule_type: "maxLength",
          rule_value: 160,
          error_message:
            "Meta description should be under 160 characters for optimal SEO",
          severity: "warning",
        },
        {
          field: "slug",
          rule_type: "pattern",
          rule_value: "^[a-z0-9-]+$",
          error_message:
            "URL slug can only contain lowercase letters, numbers, and hyphens",
          severity: "error",
        },
        {
          field: "name",
          rule_type: "required",
          rule_value: true,
          error_message: "Page name is required",
          severity: "error",
        }
      );

      setValidationRules(rules);
    } catch (error) {
      console.error("Error loading validation rules:", error);
    }
  };

  const initializeTestValues = () => {
    const initialValues: Record<string, any> = {};
    fieldConfigs.forEach((field) => {
      initialValues[field.field_name] = "";
    });
    setTestValues(initialValues);
  };

  const getDefaultErrorMessage = (
    field: string,
    ruleType: string,
    ruleValue: any
  ): string => {
    switch (ruleType) {
      case "required":
        return `${field} is required`;
      case "minLength":
        return `${field} must be at least ${ruleValue} characters`;
      case "maxLength":
        return `${field} must be no more than ${ruleValue} characters`;
      case "pattern":
        return `${field} format is invalid`;
      case "min":
        return `${field} must be at least ${ruleValue}`;
      case "max":
        return `${field} must be no more than ${ruleValue}`;
      default:
        return `${field} validation failed`;
    }
  };

  const getDangerousFields = (): string[] => {
    return fieldConfigs
      .filter((field) => field.is_dangerous)
      .map((field) => field.field_name);
  };

  const validateField = (fieldName: string, value: any): ValidationResult[] => {
    const results: ValidationResult[] = [];
    const fieldRules = validationRules.filter(
      (rule) => rule.field === fieldName
    );

    fieldRules.forEach((rule) => {
      let isValid = true;
      let suggestion = "";

      switch (rule.rule_type) {
        case "required":
          isValid =
            value !== null &&
            value !== undefined &&
            value.toString().trim() !== "";
          if (!isValid) {
            suggestion = `Please provide a value for ${fieldName}`;
          }
          break;

        case "minLength":
          isValid = value && value.toString().length >= rule.rule_value;
          if (!isValid) {
            suggestion = `Add ${
              rule.rule_value - (value?.toString().length || 0)
            } more characters`;
          }
          break;

        case "maxLength":
          isValid = !value || value.toString().length <= rule.rule_value;
          if (!isValid) {
            suggestion = `Remove ${
              value.toString().length - rule.rule_value
            } characters`;
          }
          break;

        case "pattern":
          const regex = new RegExp(rule.rule_value);
          isValid = !value || regex.test(value.toString());
          if (!isValid && fieldName === "slug") {
            suggestion =
              "Use only lowercase letters, numbers, and hyphens (e.g., 'my-page-title')";
          }
          break;

        case "min":
          isValid = !value || Number(value) >= rule.rule_value;
          break;

        case "max":
          isValid = !value || Number(value) <= rule.rule_value;
          break;
      }

      results.push({
        field: fieldName,
        isValid,
        severity: rule.severity,
        message: rule.error_message,
        suggestion,
      });
    });

    // Add SEO suggestions
    if (fieldName === "htmlTitle" && value) {
      const length = value.toString().length;
      if (length > 0 && length < 30) {
        results.push({
          field: fieldName,
          isValid: true,
          severity: "info",
          message: "Consider making your title longer for better SEO",
          suggestion:
            "Aim for 30-60 characters for optimal search engine visibility",
        });
      }
    }

    if (fieldName === "metaDescription" && value) {
      const length = value.toString().length;
      if (length > 0 && length < 120) {
        results.push({
          field: fieldName,
          isValid: true,
          severity: "info",
          message: "Consider making your meta description longer",
          suggestion: "Aim for 120-160 characters for better search snippets",
        });
      }
    }

    return results;
  };

  const validateAllFields = (
    values: Record<string, any>
  ): ValidationResult[] => {
    const allResults: ValidationResult[] = [];

    Object.entries(values).forEach(([fieldName, value]) => {
      const fieldResults = validateField(fieldName, value);
      allResults.push(...fieldResults);
    });

    return allResults;
  };

  const runValidation = () => {
    const results = validateAllFields(testValues);
    setValidationResults(results);

    const hasErrors = results.some(
      (result) => !result.isValid && result.severity === "error"
    );
    const suggestions = results
      .filter((result) => result.suggestion)
      .map((result) => result.suggestion!);

    onValidationComplete(!hasErrors, suggestions);

    // Check if dangerous fields have changes and require approval
    const dangerousChanges = Object.entries(testValues).filter(
      ([fieldName, value]) => {
        return (
          getDangerousFields().includes(fieldName) &&
          value &&
          value.toString().trim() !== ""
        );
      }
    );

    if (dangerousChanges.length > 0 && !hasErrors) {
      setPendingChanges(testValues);
      setShowApprovalDialog(true);
    }
  };

  const handleApproval = async (approved: boolean) => {
    setShowApprovalDialog(false);

    if (approved && pendingChanges) {
      // Log the approval
      try {
        await supabase.from("audit_logs").insert({
          user_id: user.id,
          action_type: "approve",
          resource_type: "validation",
          details: {
            approved_changes: pendingChanges,
            dangerous_fields: getDangerousFields().filter(
              (field) =>
                pendingChanges[field] &&
                pendingChanges[field].toString().trim() !== ""
            ),
          },
        });

        toast({
          title: "Changes Approved ✅",
          description: "Dangerous field changes have been approved and logged",
        });
      } catch (error) {
        console.error("Error logging approval:", error);
      }
    }

    setPendingChanges(null);
  };

  const getResultIcon = (result: ValidationResult) => {
    if (!result.isValid) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    switch (result.severity) {
      case "error":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getResultColor = (result: ValidationResult) => {
    if (!result.isValid) {
      return "text-red-700 bg-red-50 border-red-200";
    }
    switch (result.severity) {
      case "warning":
        return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "info":
        return "text-blue-700 bg-blue-50 border-blue-200";
      default:
        return "text-green-700 bg-green-50 border-green-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Validation Test Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Validation Engine
          </CardTitle>
          <CardDescription>
            Test your field values against validation rules and SEO best
            practices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fieldConfigs.slice(0, 6).map((field) => (
              <div key={field.field_name} className="space-y-2">
                <Label htmlFor={field.field_name}>
                  {field.display_name}
                  {getDangerousFields().includes(field.field_name) && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      High-Risk
                    </Badge>
                  )}
                </Label>
                {field.field_type === "textarea" ? (
                  <Textarea
                    id={field.field_name}
                    value={testValues[field.field_name] || ""}
                    onChange={(e) =>
                      setTestValues({
                        ...testValues,
                        [field.field_name]: e.target.value,
                      })
                    }
                    placeholder={`Enter ${field.display_name.toLowerCase()}...`}
                  />
                ) : field.field_type === "select" ? (
                  <Select
                    value={testValues[field.field_name] || ""}
                    onValueChange={(value) =>
                      setTestValues({
                        ...testValues,
                        [field.field_name]: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={`Select ${field.display_name.toLowerCase()}...`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={field.field_name}
                    type={
                      field.field_type === "datetime"
                        ? "datetime-local"
                        : "text"
                    }
                    value={testValues[field.field_name] || ""}
                    onChange={(e) =>
                      setTestValues({
                        ...testValues,
                        [field.field_name]: e.target.value,
                      })
                    }
                    placeholder={`Enter ${field.display_name.toLowerCase()}...`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Validate Button */}
          <Button onClick={runValidation} className="w-full" size="lg">
            <Shield className="mr-2 h-4 w-4" />
            Run Validation
          </Button>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Results</CardTitle>
            <CardDescription>
              Review validation results and suggestions for improvement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {validationResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded-lg ${getResultColor(result)}`}
                >
                  <div className="flex items-start gap-3">
                    {getResultIcon(result)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {fieldConfigs.find(
                            (f) => f.field_name === result.field
                          )?.display_name || result.field}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {result.severity}
                        </Badge>
                      </div>
                      <p className="text-sm">{result.message}</p>
                      {result.suggestion && (
                        <p className="text-xs mt-1 opacity-75">
                          💡 {result.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {validationResults.filter((r) => r.isValid).length} passed,{" "}
                  {validationResults.filter((r) => !r.isValid).length} failed
                </span>
                <Badge
                  variant={
                    validationResults.some(
                      (r) => !r.isValid && r.severity === "error"
                    )
                      ? "destructive"
                      : "default"
                  }
                >
                  {validationResults.some(
                    (r) => !r.isValid && r.severity === "error"
                  )
                    ? "Validation Failed"
                    : "Validation Passed"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Dialog for Dangerous Changes */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Approve High-Risk Changes
            </DialogTitle>
            <DialogDescription>
              You're about to modify fields that can significantly impact your
              website. Please review and confirm these changes.
            </DialogDescription>
          </DialogHeader>

          {pendingChanges && (
            <div className="space-y-3">
              <h4 className="font-medium">Changes requiring approval:</h4>
              {Object.entries(pendingChanges)
                .filter(
                  ([fieldName, value]) =>
                    getDangerousFields().includes(fieldName) &&
                    value &&
                    value.toString().trim() !== ""
                )
                .map(([fieldName, value]) => (
                  <div
                    key={fieldName}
                    className="p-2 bg-orange-50 border border-orange-200 rounded"
                  >
                    <div className="font-medium text-orange-900">
                      {fieldConfigs.find((f) => f.field_name === fieldName)
                        ?.display_name || fieldName}
                    </div>
                    <div className="text-sm text-orange-700 font-mono">
                      {value.toString()}
                    </div>
                  </div>
                ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => handleApproval(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleApproval(true)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Approve Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Validation Rules Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Active Validation Rules</CardTitle>
          <CardDescription>
            Current validation rules applied to your fields
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {validationRules.slice(0, 8).map((rule, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">
                    {fieldConfigs.find((f) => f.field_name === rule.field)
                      ?.display_name || rule.field}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {rule.rule_type}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{rule.error_message}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
