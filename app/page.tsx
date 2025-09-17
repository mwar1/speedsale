'use client';

import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Top navigation */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="container-max flex items-center justify-between py-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-sm font-bold tracking-tight text-white">SS</span>
            <span className="text-base font-semibold tracking-tight">SpeedSale</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="btn btn-outline btn-sm">Log in</Link>
            <Link href="/signup" className="btn btn-primary btn-sm">Get started</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Subtle animated background accents */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute -top-10 -left-10 h-72 w-72 rounded-full bg-emerald-200 opacity-40 blur-3xl animate-pulse" />
          <div className="absolute top-40 -right-10 h-80 w-80 rounded-full bg-teal-200 opacity-40 blur-3xl animate-pulse" />
          <div className="absolute -bottom-16 left-1/3 h-72 w-72 rounded-full bg-emerald-100 opacity-40 blur-3xl animate-pulse" />
        </div>
        <div className="relative z-10 container-max py-16 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">SpeedSale</h1>
            <p className="mt-4 text-lg leading-7 text-gray-600">Running shoes discounts all in one place. No searching required.</p>
            <p className="mt-2 text-sm text-gray-500">Get email notifications when your favourite shoes are cheap, so you can make the most of the offers.</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/signup" className="btn btn-primary px-5 py-3">Start free</Link>
              <Link href="/demo" className="btn btn-outline px-5 py-3">Demo dashboard</Link>
            </div>
            <p className="mt-3 text-xs text-gray-500">No credit card required • Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-200">
        <div className="container-max py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Why choose SpeedSale</h2>
          <p className="mt-2 text-sm text-gray-600">Brief supporting copy that frames the benefits and outcomes users get.</p>
        </div>
        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <li className="card">
            <div className="text-2xl">⚡</div>
            <p className="mt-3 text-base font-semibold">Fast setup</p>
            <p className="mt-1 text-sm text-gray-600">Add shoes to your watchlist in minutes and starting receiving discounts straight away.</p>
          </li>
          <li className="card">
            <div className="text-2xl">📈</div>
            <p className="mt-3 text-base font-semibold">Adjustable Prices</p>
            <p className="mt-1 text-sm text-gray-600">{"Choose the discount you're looking for, you'll only get an email when we find a price that suits you."}</p>
          </li>
          <li className="card">
            <div className="text-2xl">👟</div>
            <p className="mt-3 text-base font-semibold">Custom Watchlists</p>
            <p className="mt-1 text-sm text-gray-600">Add your favourite shoes to your personalised watchlists.</p>
          </li>
        </ul>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-b border-gray-200">
        <div className="container-max py-14">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight">What early users say</h2>
            <p className="mt-2 text-sm text-gray-600">See why other people are recommending SpeedSale.</p>
          </div>
          <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <li className="card">
              <p className="text-sm text-gray-700">“Placeholder testimonial about how SpeedSale saved time and increased conversion.”</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">AB</div>
                <div>
                  <p className="text-sm font-medium">Alex Brown</p>
                  <p className="text-xs text-gray-500">Founder, ExampleCo</p>
                </div>
              </div>
            </li>
            <li className="card">
              <p className="text-sm text-gray-700">“Placeholder testimonial about clear insights and easy onboarding.”</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">CS</div>
                <div>
                  <p className="text-sm font-medium">Casey Smith</p>
                  <p className="text-xs text-gray-500">Ops Lead, Sample.io</p>
                </div>
              </div>
            </li>
            <li className="card">
              <p className="text-sm text-gray-700">“Placeholder testimonial highlighting reliability and support.”</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">JT</div>
                <div>
                  <p className="text-sm font-medium">Jordan Taylor</p>
                  <p className="text-xs text-gray-500">PM, StartupLabs</p>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Pricing */}
      <section className="container-max py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Simple, transparent pricing</h2>
          <p className="mt-2 text-sm text-gray-600">Start free, upgrade when you want.</p>
        </div>
        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <li className="card flex flex-col">
            <p className="text-sm font-semibold text-gray-700">Starter</p>
            <p className="mt-2 text-3xl font-extrabold">£0<span className="text-base font-medium text-gray-500">/mo</span></p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• Core features</li>
              <li>• Community support</li>
              <li>• 3 watchlist items</li>
            </ul>
            <Link href="/signup" className="mt-6 btn btn-outline">Get started</Link>
          </li>
          <li className="card flex flex-col border-emerald-300 ring-1 ring-emerald-200">
            <p className="text-sm font-semibold text-emerald-700">Pro</p>
            <p className="mt-2 text-3xl font-extrabold">£9.99<span className="text-base font-medium text-gray-500">/mo</span></p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• Everything in Starter</li>
              <li>• Unlimited watchlists</li>
              <li>• In-depth statistics</li>
            </ul>
            <Link href="/signup" className="mt-6 btn btn-primary">Start Pro</Link>
          </li>
          <li className="card flex flex-col">
            <p className="text-sm font-semibold text-gray-700">Team</p>
            <p className="mt-2 text-3xl font-extrabold">£19.99<span className="text-base font-medium text-gray-500">/mo</span></p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• ...</li>
              <li>• ...</li>
              <li>• ...</li>
            </ul>
            <Link href="/signup" className="mt-6 btn btn-outline">Contact sales</Link>
          </li>
        </ul>
      </section>

      {/* FAQ */}
      <section className="border-t border-gray-200">
        <div className="container-max py-14">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Frequently asked questions</h2>
            <p className="mt-2 text-sm text-gray-600">Short answers to help users evaluate quickly.</p>
          </div>
          <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-4">
            <details className="group card p-5">
              <summary className="cursor-pointer list-none text-base font-semibold">How does the free plan work?</summary>
              <p className="mt-2 text-sm text-gray-600">{"The free plan gives you instant access to the core features of SpeedSale. \
                Add up to three shoes to your watchlist and receive emails when they're discounted."}</p>
            </details>
            <details className="group card p-5">
              <summary className="cursor-pointer list-none text-base font-semibold">Can I cancel anytime?</summary>
              <p className="mt-2 text-sm text-gray-600">Yes, you can manage your plan from your dashboard.</p>
            </details>
            <details className="group card p-5">
              <summary className="cursor-pointer list-none text-base font-semibold">Do you offer discounts?</summary>
              <p className="mt-2 text-sm text-gray-600">Yes! Students get a X% discount on all plans.</p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-max pb-16">
        <div className="card p-8 text-center">
          <h3 className="text-xl font-semibold tracking-tight">Ready to move faster?</h3>
          <p className="mt-2 text-sm text-gray-600">Try for free now.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/signup" className="btn btn-primary px-5 py-3">Get started</Link>
            <Link href="/login" className="btn btn-outline px-5 py-3">Log in</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200">
        <div className="container-max flex items-center justify-between py-6 text-sm text-gray-600">
          <span>© {new Date().getFullYear()} SpeedSale</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:underline">Log in</Link>
            <Link href="/signup" className="hover:underline">Sign up</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
