import { Skeleton } from "@/components/ui/skeleton";

/* ─── Shared helpers ──────────────────────────────────────────────── */

const SectionHeader = () => (
  <div className="text-center mb-12 md:mb-16 space-y-3">
    <Skeleton className="h-8 md:h-10 w-48 md:w-64 mx-auto" />
    <Skeleton className="h-1 w-20 mx-auto" />
    <Skeleton className="h-4 w-72 md:w-96 mx-auto" />
  </div>
);

const CardSkeleton = ({ h = "h-48" }: { h?: string }) => (
  <div className="bg-card border border-border/40 rounded-xl overflow-hidden animate-pulse">
    <Skeleton className={`${h} w-full rounded-none`} />
    <div className="p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  </div>
);

const ProductCardSkeleton = () => (
  <div className="bg-card border border-border/40 rounded-xl overflow-hidden animate-pulse">
    <Skeleton className="aspect-square w-full rounded-none" />
    <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
      <Skeleton className="h-3 sm:h-4 w-3/4" />
      <Skeleton className="h-2.5 sm:h-3 w-full" />
      <Skeleton className="h-2.5 sm:h-3 w-2/3" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-7 sm:h-8 rounded-lg flex-1" />
        <Skeleton className="h-7 sm:h-8 rounded-lg flex-1" />
      </div>
    </div>
  </div>
);

const ServiceCardSkeleton = () => (
  <div className="bg-card border border-border/40 rounded-xl overflow-hidden animate-pulse p-6">
    <Skeleton className="w-14 h-14 rounded-2xl mb-4" />
    <Skeleton className="h-5 w-3/4 mb-2" />
    <Skeleton className="h-3 w-full mb-1" />
    <Skeleton className="h-3 w-full mb-1" />
    <Skeleton className="h-3 w-2/3" />
  </div>
);

/* ─── Home Page Skeleton ──────────────────────────────────────────── */

export const HomeSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Hero section skeleton */}
    <div className="bg-gradient-to-br from-[#1a2744] via-[#1e3a5f] to-[#0f1d33] text-white pt-8 pb-12 md:pt-12 md:pb-20 lg:pt-16 lg:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 items-center gap-8">
          {/* Left content */}
          <div className="text-center md:text-left space-y-4">
            <Skeleton className="h-7 w-48 rounded-full mx-auto md:mx-0 bg-white/10" />
            <Skeleton className="h-4 w-56 mx-auto md:mx-0 bg-white/10" />
            <Skeleton className="h-10 md:h-12 w-full max-w-md mx-auto md:mx-0 bg-white/10" />
            <Skeleton className="h-4 w-full max-w-lg mx-auto md:mx-0 bg-white/10" />
            <div className="flex items-center justify-center md:justify-start gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-5 w-14 bg-white/10" />
                  <Skeleton className="h-3 w-12 bg-white/10" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-center md:justify-start">
              <Skeleton className="h-10 w-36 rounded-lg bg-white/15" />
              <Skeleton className="h-10 w-28 rounded-lg bg-white/10" />
            </div>
          </div>
          {/* Right card */}
          <div className="flex justify-center md:justify-end">
            <div className="w-full max-w-xs sm:max-w-sm bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-4">
              <Skeleton className="w-20 h-20 rounded-full mx-auto bg-white/10" />
              <Skeleton className="h-5 w-3/4 mx-auto bg-white/10" />
              <Skeleton className="h-3 w-full bg-white/10" />
              <Skeleton className="h-3 w-5/6 mx-auto bg-white/10" />
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-8 rounded-lg bg-white/10" />
                ))}
              </div>
              <Skeleton className="h-10 rounded-xl bg-white/15" />
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Stats */}
    <div className="bg-white dark:bg-gray-800 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-blue-50 dark:bg-gray-700 p-6 md:p-8 rounded-xl space-y-3 animate-pulse">
              <Skeleton className="h-10 w-24 mx-auto" />
              <Skeleton className="h-5 w-32 mx-auto" />
              <Skeleton className="h-7 w-7 mx-auto rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* About section */}
    <div className="py-16 md:py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader />
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="md:w-1/2">
            <Skeleton className="w-full aspect-[4/3] rounded-lg" />
          </div>
          <div className="md:w-1/2 space-y-4">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="space-y-3 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
            <Skeleton className="h-10 w-44 rounded-md mt-4" />
          </div>
        </div>
      </div>
    </div>

    {/* Services section */}
    <div className="py-16 md:py-20 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>

    {/* Products section */}
    <div className="py-16 md:py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>

    {/* Gallery section */}
    <div className="py-16 md:py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-lg overflow-hidden animate-pulse">
              <Skeleton className="h-56 sm:h-64 w-full rounded-none" />
              <div className="bg-white dark:bg-gray-700 px-4 py-3">
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Tips section */}
    <div className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-pulse">
              <Skeleton className="h-48 w-full rounded-none" />
              <div className="p-6 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Testimonials section */}
    <div className="py-20 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader />
        <div className="flex gap-4 overflow-hidden max-w-5xl mx-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-700 p-8 rounded-lg flex-shrink-0 w-80 animate-pulse">
              <div className="flex items-center mb-6">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="ml-4 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <div className="flex gap-1 mt-4">
                {[1, 2, 3, 4, 5].map((j) => (
                  <Skeleton key={j} className="h-5 w-5" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* FAQ section */}
    <div className="py-16 md:py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader />
        <div className="max-w-3xl mx-auto space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 md:p-6 animate-pulse">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-5 w-5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Why Choose Us section */}
    <div className="py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="text-3xl font-bold w-10 h-8" />
                <Skeleton className="w-12 h-12 md:w-14 md:h-14 rounded-2xl" />
              </div>
              <Skeleton className="h-5 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Team section */}
    <div className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center text-center space-y-3 animate-pulse">
              <Skeleton className="w-28 h-28 rounded-full" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* CTA section */}
    <div className="py-16 bg-gradient-to-r from-blue-600 to-blue-700">
      <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
        <Skeleton className="h-8 w-72 mx-auto bg-white/15" />
        <Skeleton className="h-4 w-96 mx-auto bg-white/10" />
        <Skeleton className="h-10 w-40 mx-auto rounded-lg bg-white/20" />
      </div>
    </div>
  </div>
);

/* ─── About Page Skeleton ─────────────────────────────────────────── */

export const AboutSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Hero */}
    <div className="bg-gradient-to-br from-[#1a2744] via-[#1e3a5f] to-[#0f1d33] py-20">
      <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
        <Skeleton className="h-10 w-64 mx-auto bg-white/10" />
        <Skeleton className="h-4 w-96 mx-auto bg-white/10" />
      </div>
    </div>

    {/* Who We Are */}
    <div className="py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader />
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="md:w-1/2">
            <Skeleton className="w-full aspect-[4/3] rounded-lg" />
          </div>
          <div className="md:w-1/2 space-y-4">
            <Skeleton className="h-7 w-48" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Mission Vision */}
    <div className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeader />
        <div className="grid md:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-8 space-y-4 animate-pulse">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Team */}
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeader />
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center text-center space-y-3 animate-pulse">
              <Skeleton className="w-28 h-28 rounded-full" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ─── Services Page Skeleton ──────────────────────────────────────── */

export const ServicesSkeleton = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
    {/* Hero */}
    <div className="bg-gradient-to-br from-[#1a2744] via-[#1e3a5f] to-[#0f1d33] py-20">
      <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
        <Skeleton className="h-10 w-56 mx-auto bg-white/10" />
        <Skeleton className="h-4 w-80 mx-auto bg-white/10" />
      </div>
    </div>

    <div className="py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ─── Products Page Skeleton ──────────────────────────────────────── */

export const ProductsSkeleton = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
    {/* Hero */}
    <div className="bg-gradient-to-br from-[#1a2744] via-[#1e3a5f] to-[#0f1d33] py-16">
      <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
        <Skeleton className="h-10 w-48 mx-auto bg-white/10" />
        <Skeleton className="h-4 w-72 mx-auto bg-white/10" />
      </div>
    </div>

    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Skeleton className="h-10 w-48 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ─── Contact Page Skeleton ───────────────────────────────────────── */

export const ContactSkeleton = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
    {/* Hero */}
    <div className="bg-gradient-to-br from-[#1a2744] via-[#1e3a5f] to-[#0f1d33] py-20">
      <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
        <Skeleton className="h-10 w-40 mx-auto bg-white/10" />
        <Skeleton className="h-4 w-72 mx-auto bg-white/10" />
      </div>
    </div>

    <div className="py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact info */}
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4 animate-pulse">
                <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="bg-card border border-border rounded-xl p-6 md:p-8 space-y-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ─── Auth Page Skeleton (Login / Signup) ─────────────────────────── */

export const AuthSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 space-y-6 animate-pulse">
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-8 mx-auto rounded-full" />
        <Skeleton className="h-6 w-32 mx-auto" />
        <Skeleton className="h-3 w-48 mx-auto" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  </div>
);

/* ─── Admin/Technician Panel Skeleton ─────────────────────────────── */

export const AdminSkeleton = () => (
  <div className="min-h-screen flex bg-background">
    {/* Sidebar */}
    <div className="hidden lg:flex flex-col w-64 border-r border-border bg-card p-4 space-y-2 animate-pulse">
      <div className="flex items-center gap-2 mb-6 px-2">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="h-5 w-32" />
      </div>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-3 w-28" />
        </div>
      ))}
    </div>

    {/* Main */}
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-border bg-card flex items-center justify-between px-6 animate-pulse">
        <Skeleton className="h-5 w-40" />
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-2 animate-pulse">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-2 w-24" />
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden animate-pulse">
          <div className="p-4 border-b border-border">
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ─── User Dashboard Skeleton ─────────────────────────────────────── */

export const DashboardSkeleton = () => (
  <div className="min-h-screen flex bg-background">
    {/* Sidebar */}
    <div className="hidden lg:flex flex-col w-64 border-r border-border bg-card p-4 space-y-2 animate-pulse">
      <div className="flex items-center gap-2 mb-6 px-2">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="h-5 w-32" />
      </div>
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-3 w-28" />
        </div>
      ))}
    </div>

    {/* Main */}
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-border bg-card flex items-center justify-between px-6 animate-pulse">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Welcome */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3 w-72" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-2 animate-pulse">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>

        {/* Recent items */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4 animate-pulse">
          <Skeleton className="h-5 w-32" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-2 w-32" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ─── Generic Page Skeleton ───────────────────────────────────────── */

export const GenericSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Hero */}
    <div className="bg-gradient-to-br from-[#1a2744] via-[#1e3a5f] to-[#0f1d33] py-20">
      <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
        <Skeleton className="h-10 w-56 mx-auto bg-white/10" />
        <Skeleton className="h-4 w-80 mx-auto bg-white/10" />
      </div>
    </div>

    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <SectionHeader />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  </div>
);
