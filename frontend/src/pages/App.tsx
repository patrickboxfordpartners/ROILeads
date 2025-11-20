import React, { useState } from "react";
import { TrendingUp, Calculator, Mail, Building2, User, Phone, Loader2, StickyNote } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { apiClient } from "app";
import type { LeadSubmissionRequest, RoiChartBar, RoiCalculationResult, RoiInputs } from "types";
import { type FieldError, type FieldErrors, type Resolver, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

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
    const [showLeadForm, setShowLeadForm] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [leadSubmitting, setLeadSubmitting] = useState(false);
    const [autoOpenLeadForm, setAutoOpenLeadForm] = useState(true);

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
        setShowLeadForm(false);
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
            resetLeadCapture();
            const response = await apiClient.run_roi_calculation(body);
            const data = await response.json();
            setResult(data);
            if (autoOpenLeadForm) {
                setShowLeadForm(true);
            }
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
            form.reset();
            setSubmitted(true);
            setShowLeadForm(false);
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

    const chartData: RoiChartBar[] = (result?.chart || []).map((bar) => ({
        name: bar.name,
        Annual: Math.round(bar.annual),
    }));

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-12 max-w-5xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-4">
                        <div className="bg-primary text-primary-foreground p-3 rounded-lg">
                            <Calculator className="w-8 h-8" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-foreground mb-3">Automation ROI Calculator</h1>
                    <p className="text-muted-foreground text-lg">
                        Calculate how much you can save by automating manual tasks
                    </p>
                </div>

                {/* Calculator Card */}
                <div className="bg-card border border-border rounded-xl p-8 mb-8 shadow-sm">
                    <h2 className="text-2xl font-semibold text-card-foreground mb-6">Your Current Situation</h2>

                    <div className="space-y-6">
                        {/* Hours per week */}
                        <div>
                            <label className="block text-sm font-medium text-card-foreground mb-2">
                                Hours spent on manual tasks per week
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="1"
                                    max="40"
                                    value={hoursPerWeek}
                                    onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                                    className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <input
                                    type="number"
                                    value={hoursPerWeek}
                                    onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                                    className="w-20 px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        </div>

                        {/* Labor rate */}
                        <div>
                            <label className="block text-sm font-medium text-card-foreground mb-2">
                                Average hourly labor rate ($)
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="20"
                                    max="200"
                                    step="5"
                                    value={laborRate}
                                    onChange={(e) => setLaborRate(Number(e.target.value))}
                                    className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <input
                                    type="number"
                                    value={laborRate}
                                    onChange={(e) => setLaborRate(Number(e.target.value))}
                                    className="w-20 px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        </div>

                        {/* Tool cost */}
                        <div>
                            <label className="block text-sm font-medium text-card-foreground mb-2">
                                Monthly automation tool cost ($)
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="100"
                                    max="2000"
                                    step="50"
                                    value={toolCost}
                                    onChange={(e) => setToolCost(Number(e.target.value))}
                                    className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <input
                                    type="number"
                                    value={toolCost}
                                    onChange={(e) => setToolCost(Number(e.target.value))}
                                    className="w-20 px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        </div>

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

                        {/* Calculate button */}
                        <Button
                            onClick={handleCalculate}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Calculating...
                                </>
                            ) : (
                                "Calculate My ROI"
                            )}
                        </Button>
                    </div>
                </div>

                {/* Results Section */}
                {result && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-card border border-border rounded-xl p-6">
                                <p className="text-sm text-muted-foreground mb-1">Industry Profile</p>
                                <p className="text-2xl font-semibold text-card-foreground mb-2">{result.profile.label}</p>
                                <p className="text-sm text-muted-foreground mb-4">{result.profile.description}</p>
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    <span className="bg-muted text-foreground px-3 py-1 rounded-full">
                                        Capture {Math.round(result.profile.savings_rate * 100)}%
                                    </span>
                                    <span className="bg-muted text-foreground px-3 py-1 rounded-full">
                                        Variance ±{Math.round(result.profile.variance * 100)} pts
                                    </span>
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-xl p-6 lg:col-span-2">
                                <p className="text-sm text-muted-foreground mb-2">Impact Summary</p>
                                <p className="text-2xl font-semibold text-card-foreground mb-4">
                                    {result.narrative.headline}
                                </p>
                                <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                                    {result.narrative.highlights.map((highlight) => (
                                        <li key={highlight} className="text-base text-foreground">
                                            {highlight}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-card border border-border rounded-xl p-6">
                                <p className="text-sm text-muted-foreground mb-1">Annual Savings</p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-500">
                                    ${result.metrics.net_annual_savings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </p>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-6">
                                <p className="text-sm text-muted-foreground mb-1">Monthly Savings</p>
                                <p className="text-3xl font-bold text-foreground">
                                    ${Math.round(result.metrics.monthly_savings).toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-6">
                                <p className="text-sm text-muted-foreground mb-1">Payback Period</p>
                                <p className="text-3xl font-bold text-foreground">
                                    {result.metrics.payback_months ? `${result.metrics.payback_months.toFixed(1)} months` : "Immediate"}
                                </p>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="bg-card border border-border rounded-xl p-8">
                            <h3 className="text-xl font-semibold text-card-foreground mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-500" />
                                Cost Comparison
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                    <XAxis dataKey="name" className="text-muted-foreground" />
                                    <YAxis className="text-muted-foreground" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="Annual" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* CTA to show lead form */}
                        <div className="bg-muted/40 border border-border rounded-xl p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm font-medium text-foreground">Auto-open lead capture</p>
                                <p className="text-sm text-muted-foreground">
                                    When enabled, your contact form appears immediately after each calculation.
                                </p>
                            </div>
                            <Switch
                                checked={autoOpenLeadForm}
                                onCheckedChange={(checked) => {
                                    setAutoOpenLeadForm(checked);
                                    if (!checked) {
                                        setShowLeadForm(false);
                                    } else if (result) {
                                        setShowLeadForm(true);
                                    }
                                }}
                                aria-label="Toggle automatic lead form"
                            />
                        </div>

                        {!showLeadForm && !submitted && (
                            <Card className="bg-accent/40 border border-border text-center">
                                <CardHeader>
                                    <CardTitle className="text-2xl">Get Your Detailed ROI Report</CardTitle>
                                    <CardDescription>
                                        Receive a personalized breakdown, implementation roadmap, and quick next steps.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button size="lg" className="w-full md:w-auto" onClick={() => setShowLeadForm(true)}>
                                        Get My Free Report
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Lead Capture Form */}
                        {showLeadForm && !submitted && (
                            <Card className="border border-border">
                                <CardHeader>
                                    <CardTitle className="text-2xl">Your Contact Information</CardTitle>
                                    <CardDescription>
                                        We will send the full ROI model plus a recommended automation rollout.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(handleLeadSubmit)} className="space-y-5">
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <FormField
                                                    control={form.control}
                                                    name="name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                                                                <User className="h-4 w-4" /> Full Name
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="John Smith" {...field} />
                                                            </FormControl>
                                                            <FormDescription>Used on your Monday.com lead and email report.</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="email"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                                                                <Mail className="h-4 w-4" /> Email Address
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input type="email" placeholder="john@company.com" {...field} />
                                                            </FormControl>
                                                            <FormDescription>We send the ROI summary and follow-ups here.</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <FormField
                                                    control={form.control}
                                                    name="company"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                                                                <Building2 className="h-4 w-4" /> Company Name
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Acme Corp" {...field} />
                                                            </FormControl>
                                                            <FormDescription>Helps us tailor benchmarks for your industry.</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="phone"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                                                                <Phone className="h-4 w-4" /> Phone Number
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input type="tel" placeholder="(555) 123-4567" {...field} />
                                                            </FormControl>
                                                            <FormDescription>Optional follow-up channel if email bounces.</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="notes"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-2 text-sm font-medium">
                                                            <StickyNote className="h-4 w-4" /> Notes or Focus Areas (optional)
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Share current workflows, systems, or success criteria (max 1,000 characters)."
                                                                className="min-h-[120px]"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>Include context so the automation roadmap lands right away.</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <Button
                                                type="submit"
                                                className="w-full"
                                                disabled={leadSubmitting}
                                            >
                                                {leadSubmitting ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                        Sending...
                                                    </span>
                                                ) : (
                                                    "Send My Report"
                                                )}
                                            </Button>
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>
                        )}

                        {/* Submission Confirmation */}
                        {submitted && (
                            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-8 text-center">
                                <div className="flex justify-center mb-4">
                                    <div className="bg-green-600 dark:bg-green-500 text-white p-3 rounded-full">
                                        <Mail className="w-8 h-8" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-semibold text-green-900 dark:text-green-100 mb-3">
                                    Report Sent!
                                </h3>
                                <p className="text-green-700 dark:text-green-300">
                                    Check your email for your detailed ROI analysis and next steps.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
