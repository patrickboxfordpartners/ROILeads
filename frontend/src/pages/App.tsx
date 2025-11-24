import React, { useState, useMemo } from "react";
import { TrendingUp, Calculator, Mail, Building2, User, Phone, Loader2, StickyNote, Lock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { apiClient } from "app";
import type { LeadSubmissionRequest, RoiCalculationResult, RoiInputs } from "types";
import { type FieldError, type FieldErrors, type Resolver, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const leadFormSchema = z.object({
    name: z.string().min(2, "Please enter a valid name"),
    email: z.string().email("Enter a valid work email"),
    company: z.string().min(2, "Company name is required"),
    phone: z.string().min(7, "Phone number is required"),
    notes: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

const leadFormResolver: Resolver<LeadFormValues> = async (values) => {
    const result = leadFormSchema.safeParse(values);

    if (result.success) {
        return {
            values: result.data,
            errors: {},
        };
    }

    const fieldErrors = result.error.issues.reduce<Record<string, FieldError>>((acc, issue) => {
        const pathKey = issue.path.join(".") || "form";
        acc[pathKey] = {
            type: issue.code,
            message: issue.message,
        };
        return acc;
    }, {});

    return {
        values: {},
        errors: fieldErrors as FieldErrors<LeadFormValues>,
    };
};

export default function App() {
    const [hoursPerWeek, setHoursPerWeek] = useState(10);
    const [laborRate, setLaborRate] = useState(50);
    const [toolCost, setToolCost] = useState(500);
    const [industry, setIndustry] = useState("general");
    const [loading, setLoading] = useState(false);
    
    const [result, setResult] = useState<RoiCalculationResult | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [leadSubmitting, setLeadSubmitting] = useState(false);

    const form = useForm<LeadFormValues>({
        resolver: leadFormResolver,
        defaultValues: {
            name: "",
            email: "",
            company: "",
            phone: "",
            notes: "",
        },
    });

    const resetLeadCapture = () => {
        setSubmitted(false);
        setLeadSubmitting(false);
        form.reset();
    };

    const handleCalculate = async () => {
        const body: RoiInputs = {
            hours_per_week: hoursPerWeek,
            labor_rate: laborRate,
            tool_cost: toolCost,
            industry,
        };

        try {
            setLoading(true);
            // We do NOT reset the form here to allow users to tweak params without losing lead info
            // But we might want to reset the "submitted" state if they change inputs significantly? 
            // For now, let's keep them unlocked if they already submitted.
            const response = await apiClient.run_roi_calculation(body);
            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error("ROI calculation failed", error);
            toast.error("Unable to calculate ROI right now. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleLeadSubmit = async (values: LeadFormValues) => {
        if (!result) {
            toast.error("Please run the calculator before submitting.");
            return;
        }

        const payload: LeadSubmissionRequest = {
            contact: {
                name: values.name,
                email: values.email,
                company: values.company,
                phone: values.phone,
                notes: values.notes?.trim() ? values.notes.trim() : undefined,
            },
            inputs: result.inputs,
        };

        try {
            setLeadSubmitting(true);
            const response = await apiClient.submit_lead(payload);
            const data = await response.json();
            setResult(data.roi);
            setSubmitted(true);
            toast.success("Report on its way! Check your inbox shortly.");
        } catch (error) {
            console.error("Lead submission failed", error);
            toast.error("We couldn't save your details. Please try again.");
        } finally {
            setLeadSubmitting(false);
        }
    };

    const industryOptions = [
        { value: "general", label: "General / Services" },
        { value: "manufacturing", label: "Manufacturing" },
        { value: "retail", label: "Retail / E-commerce" },
        { value: "automotive", label: "Automotive" },
        { value: "personal_care", label: "Personal Care" },
    ];

    // Calculate cumulative savings for Area Chart
    const chartData = useMemo(() => {
        if (!result) return [];
        const monthly = result.metrics.monthly_savings;
        const netAnnual = result.metrics.net_annual_savings;
        
        // Simple projection for the chart
        return [
            { name: "Month 0", Savings: 0 },
            { name: "Month 3", Savings: monthly * 3 },
            { name: "Month 6", Savings: monthly * 6 },
            { name: "Month 9", Savings: monthly * 9 },
            { name: "Year 1", Savings: netAnnual }, // Use net annual to account for tool costs accurately
        ];
    }, [result]);

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-4">
                        <div className="bg-primary text-primary-foreground p-3 rounded-lg">
                            <Calculator className="w-8 h-8" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-foreground mb-3">Automation ROI Calculator</h1>
                    <p className="text-muted-foreground text-lg">
                        See exactly how much time & money your team could be saving.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LEFT COLUMN: Inputs (Sticky) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-card border border-border rounded-xl p-6 shadow-sm lg:sticky lg:top-6">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" /> Parameters
                            </h2>

                            <div className="space-y-6">
                                {/* Industry */}
                                <div>
                                    <label className="block text-sm font-medium text-card-foreground mb-2">
                                        Industry
                                    </label>
                                    <select
                                        value={industry}
                                        onChange={(e) => setIndustry(e.target.value)}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        {industryOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Hours per week */}
                                <div>
                                    <label className="block text-sm font-medium text-card-foreground mb-2">
                                        Manual hours / week
                                    </label>
                                    <div className="p-4 border border-input rounded-lg bg-accent/20">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-muted-foreground text-xs uppercase font-semibold tracking-wider">Hours</span>
                                            <span className="text-xl font-bold font-mono">{hoursPerWeek}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="100"
                                            value={hoursPerWeek}
                                            onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                                            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                </div>

                                {/* Labor rate */}
                                <div>
                                    <label className="block text-sm font-medium text-card-foreground mb-2">
                                        Avg. Hourly Rate
                                    </label>
                                    <div className="p-4 border border-input rounded-lg bg-accent/20">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-muted-foreground text-xs uppercase font-semibold tracking-wider">USD / Hour</span>
                                            <span className="text-xl font-bold font-mono">${laborRate}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="20"
                                            max="300"
                                            step="5"
                                            value={laborRate}
                                            onChange={(e) => setLaborRate(Number(e.target.value))}
                                            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                </div>

                                {/* Tool cost */}
                                <div>
                                    <label className="block text-sm font-medium text-card-foreground mb-2">
                                        Est. Tool Cost (Monthly)
                                    </label>
                                    <div className="p-4 border border-input rounded-lg bg-accent/20">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-muted-foreground text-xs uppercase font-semibold tracking-wider">USD / Month</span>
                                            <span className="text-xl font-bold font-mono">${toolCost}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="5000"
                                            step="50"
                                            value={toolCost}
                                            onChange={(e) => setToolCost(Number(e.target.value))}
                                            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                </div>

                                {/* Calculate button */}
                                <Button
                                    onClick={handleCalculate}
                                    disabled={loading}
                                    size="lg"
                                    className="w-full font-semibold"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                            Calculating...
                                        </>
                                    ) : (
                                        "Update Calculation"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Results & "The Gate" */}
                    <div className="lg:col-span-8">
                        {!result ? (
                             <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-muted-foreground p-12 border-2 border-dashed border-border rounded-xl bg-card/50">
                                <Calculator className="w-12 h-12 mb-4 opacity-20" />
                                <p className="text-lg">Adjust the parameters and click calculate to see your potential savings.</p>
                             </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in duration-500 slide-in-from-bottom-4">
                                
                                {/* 1. The Teaser / Top Line Number (Always Visible) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <TrendingUp className="w-24 h-24 text-primary" />
                                        </div>
                                        <p className="text-sm font-medium text-primary mb-1">Projected Annual Savings</p>
                                        <p className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight">
                                            ${result.metrics.net_annual_savings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </p>
                                        <p className="text-sm text-primary/80 mt-2">Net of tool costs</p>
                                    </div>
                                    
                                    <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-center">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-baseline border-b border-border pb-2">
                                                <span className="text-sm text-muted-foreground">Monthly Unlock</span>
                                                <span className="text-xl font-bold">${Math.round(result.metrics.monthly_savings).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-baseline border-b border-border pb-2">
                                                <span className="text-sm text-muted-foreground">Payback Period</span>
                                                <span className="text-xl font-bold">
                                                    {result.metrics.payback_months 
                                                        ? `${result.metrics.payback_months.toFixed(1)} mo` 
                                                        : "Immediate"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. The Gated Content (Blurred if not submitted) */}
                                <div className="relative">
                                    <div className={`transition-all duration-700 ${!submitted ? "blur-md opacity-60 select-none pointer-events-none" : ""}`}>
                                        
                                        {/* Chart */}
                                        <div className="bg-card border border-border rounded-xl p-8 mb-6">
                                            <h3 className="text-xl font-semibold text-card-foreground mb-6">Cumulative Savings Trajectory</h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <AreaChart data={chartData}>
                                                    <defs>
                                                        <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                                                    <XAxis dataKey="name" className="text-muted-foreground text-xs" axisLine={false} tickLine={false} />
                                                    <YAxis className="text-muted-foreground text-xs" axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`}/>
                                                    <Tooltip 
                                                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                                                        formatter={(value: number) => [`$${Math.round(value).toLocaleString()}`, "Savings"]}
                                                    />
                                                    <Area type="monotone" dataKey="Savings" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorSavings)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Narrative / Breakdown */}
                                        <div className="bg-card border border-border rounded-xl p-8">
                                            <h3 className="text-xl font-semibold mb-4">Analysis & Highlights</h3>
                                            <p className="text-2xl font-medium text-card-foreground mb-4">{result.narrative.headline}</p>
                                            <ul className="space-y-3">
                                                {result.narrative.highlights.map((h, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full mt-1">
                                                            <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                                                        </div>
                                                        <span className="text-muted-foreground">{h}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* 3. The Gate / Unlock Form Overlay */}
                                    {!submitted && (
                                        <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                                            <div className="bg-background/95 backdrop-blur-sm border border-border shadow-2xl rounded-2xl p-6 md:p-8 max-w-lg w-full">
                                                <div className="text-center mb-6">
                                                    <div className="inline-flex items-center justify-center bg-primary/10 p-3 rounded-full mb-4">
                                                        <Lock className="w-6 h-6 text-primary" />
                                                    </div>
                                                    <h3 className="text-2xl font-bold">Unlock Full Breakdown</h3>
                                                    <p className="text-muted-foreground mt-2">
                                                        Get the detailed implementation roadmap and shareable PDF report sent to your inbox.
                                                    </p>
                                                </div>

                                                <Form {...form}>
                                                    <form onSubmit={form.handleSubmit(handleLeadSubmit)} className="space-y-4 text-left">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <FormField
                                                                control={form.control}
                                                                name="name"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Name</FormLabel>
                                                                        <FormControl>
                                                                            <Input placeholder="Jane Doe" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <FormField
                                                                control={form.control}
                                                                name="company"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Company</FormLabel>
                                                                        <FormControl>
                                                                            <Input placeholder="Acme Inc" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                        <FormField
                                                            control={form.control}
                                                            name="email"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Work Email</FormLabel>
                                                                    <FormControl>
                                                                        <Input type="email" placeholder="jane@company.com" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name="phone"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Phone</FormLabel>
                                                                    <FormControl>
                                                                        <Input type="tel" placeholder="+1 (555) 000-0000" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        
                                                        <Button type="submit" className="w-full" size="lg" disabled={leadSubmitting}>
                                                            {leadSubmitting ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                    Processing...
                                                                </>
                                                            ) : (
                                                                "Unlock Report"
                                                            )}
                                                        </Button>
                                                        
                                                        <p className="text-xs text-center text-muted-foreground mt-4">
                                                            We respect your privacy. Unsubscribe at any time.
                                                        </p>
                                                    </form>
                                                </Form>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Success State */}
                                {submitted && (
                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-4 animate-in zoom-in-95">
                                        <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                                            <Mail className="w-5 h-5 text-green-700 dark:text-green-300" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-green-800 dark:text-green-200">Full Report Sent!</p>
                                            <p className="text-sm text-green-700 dark:text-green-300">
                                                Check your inbox for the detailed breakdown.
                                            </p>
                                        </div>
                                    </div>
                                )}

                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
