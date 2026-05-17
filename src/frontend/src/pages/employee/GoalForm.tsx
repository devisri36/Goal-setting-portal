import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Info, Save, X } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  useCreateGoal,
  useThrustAreas,
  useUpdateGoal,
} from "../../hooks/useGoals";
import { GoalStatus, UoMDirection, UoMType } from "../../lib/types";
import type { Goal } from "../../lib/types";

interface GoalFormProps {
  onClose: () => void;
  editGoal?: Goal;
}

interface FormValues {
  thrustAreaId: string;
  title: string;
  description: string;
  uomType: UoMType;
  uomDirection: UoMDirection | "";
  target: string;
  weightage: string;
}

const UOM_TYPE_OPTIONS = [
  { value: UoMType.Numeric, label: "Numeric" },
  { value: UoMType.Percent, label: "Percent (%)" },
  { value: UoMType.Timeline, label: "Timeline (date-based)" },
  { value: UoMType.ZeroBased, label: "Zero-based (0 = success)" },
];

const UOM_DIR_OPTIONS = [
  { value: UoMDirection.Min, label: "Min (higher is better, e.g. Sales)" },
  { value: UoMDirection.Max, label: "Max (lower is better, e.g. Costs)" },
];

export default function GoalForm({ onClose, editGoal }: GoalFormProps) {
  const { data: thrustAreas = [], isLoading: loadingAreas } = useThrustAreas();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();

  const isEditing = !!editGoal;
  const isShared = editGoal?.isShared ?? false;
  const _canEditFull =
    !isEditing ||
    editGoal.status === GoalStatus.Draft ||
    editGoal.status === GoalStatus.ReturnedForRework;

  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      thrustAreaId: editGoal?.thrustAreaId ?? "",
      title: editGoal?.title ?? "",
      description: editGoal?.description ?? "",
      uomType: editGoal?.uomType ?? UoMType.Numeric,
      uomDirection: editGoal?.uomDirection ?? "",
      target: editGoal?.target?.toString() ?? "",
      weightage: editGoal?.weightage?.toString() ?? "",
    },
  });

  const watchedUomType = watch("uomType");
  const needsDirection =
    watchedUomType === UoMType.Numeric || watchedUomType === UoMType.Percent;

  useEffect(() => {
    if (editGoal) {
      reset({
        thrustAreaId: editGoal.thrustAreaId,
        title: editGoal.title,
        description: editGoal.description,
        uomType: editGoal.uomType,
        uomDirection: editGoal.uomDirection ?? "",
        target: editGoal.target.toString(),
        weightage: editGoal.weightage.toString(),
      });
    }
  }, [editGoal, reset]);

  const onSubmit = async (data: FormValues) => {
    const uomDir =
      needsDirection && data.uomDirection
        ? (data.uomDirection as UoMDirection)
        : null;
    if (isEditing && editGoal) {
      await updateGoal.mutateAsync({
        goalId: editGoal.id,
        title: data.title,
        description: data.description,
        uomType: data.uomType,
        uomDirection: uomDir,
        target: Number.parseFloat(data.target),
        weightage: Number.parseFloat(data.weightage),
      });
    } else {
      await createGoal.mutateAsync({
        thrustAreaId: data.thrustAreaId,
        title: data.title,
        description: data.description,
        uomType: data.uomType,
        uomDirection: uomDir,
        target: Number.parseFloat(data.target),
        weightage: Number.parseFloat(data.weightage),
      });
    }
    onClose();
  };

  return (
    <Card
      className="border-primary/30 shadow-subtle"
      data-ocid="employee.goal_form.card"
    >
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold text-foreground">
          {isEditing ? "Edit Goal" : "Create New Goal"}
        </CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          data-ocid="employee.goal_form.close_button"
        >
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isShared && (
          <div className="mb-4 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              This is a <strong>shared goal</strong>. Title and target are
              read-only. You may only adjust the weightage.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Thrust Area */}
          {!isEditing && (
            <div className="space-y-1.5">
              <Label htmlFor="thrustAreaId" className="text-xs font-medium">
                Thrust Area <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="thrustAreaId"
                control={control}
                rules={{ required: "Thrust area is required" }}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loadingAreas}
                  >
                    <SelectTrigger data-ocid="employee.goal_form.thrust_area_select">
                      <SelectValue placeholder="Select thrust area…" />
                    </SelectTrigger>
                    <SelectContent>
                      {thrustAreas.map((ta) => (
                        <SelectItem key={ta.id} value={ta.id}>
                          {ta.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.thrustAreaId && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="employee.goal_form.thrust_area_field_error"
                >
                  {errors.thrustAreaId.message}
                </p>
              )}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-medium">
              Goal Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g. Increase quarterly revenue by 15%"
              disabled={isShared}
              {...register("title", {
                required: "Title is required",
                minLength: { value: 5, message: "Min 5 characters" },
                maxLength: { value: 120, message: "Max 120 characters" },
              })}
              data-ocid="employee.goal_form.title_input"
            />
            {errors.title && (
              <p
                className="text-xs text-destructive"
                data-ocid="employee.goal_form.title_field_error"
              >
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the goal and how success will be measured…"
              rows={3}
              disabled={isShared}
              {...register("description")}
              data-ocid="employee.goal_form.description_textarea"
            />
          </div>

          {/* UoM Type + Direction */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Unit of Measurement <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="uomType"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isShared}
                  >
                    <SelectTrigger data-ocid="employee.goal_form.uom_type_select">
                      <SelectValue placeholder="Select UoM…" />
                    </SelectTrigger>
                    <SelectContent>
                      {UOM_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {needsDirection && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Direction <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="uomDirection"
                  control={control}
                  rules={{
                    required: needsDirection ? "Direction required" : false,
                  }}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isShared}
                    >
                      <SelectTrigger data-ocid="employee.goal_form.uom_direction_select">
                        <SelectValue placeholder="Select direction…" />
                      </SelectTrigger>
                      <SelectContent>
                        {UOM_DIR_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.uomDirection && (
                  <p className="text-xs text-destructive">
                    {errors.uomDirection.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Target + Weightage */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="target" className="text-xs font-medium">
                Target Value <span className="text-destructive">*</span>
              </Label>
              <Input
                id="target"
                type="number"
                step="any"
                placeholder="e.g. 100"
                disabled={isShared}
                {...register("target", {
                  required: "Target is required",
                  min: { value: 0, message: "Must be ≥ 0" },
                })}
                data-ocid="employee.goal_form.target_input"
              />
              {errors.target && (
                <p className="text-xs text-destructive">
                  {errors.target.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="weightage" className="text-xs font-medium">
                Weightage (%) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="weightage"
                type="number"
                min="10"
                max="100"
                step="5"
                placeholder="e.g. 20"
                {...register("weightage", {
                  required: "Weightage is required",
                  min: { value: 10, message: "Min 10%" },
                  max: { value: 100, message: "Max 100%" },
                })}
                data-ocid="employee.goal_form.weightage_input"
              />
              {errors.weightage && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="employee.goal_form.weightage_field_error"
                >
                  {errors.weightage.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Min 10%, must total 100% across all goals
              </p>
            </div>
          </div>

          {/* UoM info block */}
          <div className="bg-muted/60 rounded-lg p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">
              Progress formula reference
            </p>
            <ul className="space-y-0.5">
              <li>
                • <strong>Numeric / % Min</strong>: Achievement ÷ Target
              </li>
              <li>
                • <strong>Numeric / % Max</strong>: Target ÷ Achievement
              </li>
              <li>
                • <strong>Timeline</strong>: Completion date vs. Deadline
              </li>
              <li>
                • <strong>Zero-based</strong>: 0 = 100%, else 0%
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              data-ocid="employee.goal_form.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={
                isSubmitting || createGoal.isPending || updateGoal.isPending
              }
              data-ocid="employee.goal_form.submit_button"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {isEditing ? "Save Changes" : "Create Goal"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
