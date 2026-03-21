"use client";

import { useRouter } from "next/navigation";

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div
        className="bg-white px-6 flex items-center gap-4"
        style={{ paddingTop: "max(env(safe-area-inset-top), 1.5rem)", height: "80px" }}
      >
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center"
        >
          <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="max-w-md mx-auto px-6 py-2 space-y-6 pb-12">
        <div>
          <h1 className="text-2xl font-bold text-black">Privacy Policy &amp; Terms of Service</h1>
          <p className="text-md text-gray-700 mt-2">Novi · Beta Version · March 2026</p>
        </div>

        {/* Privacy Policy */}
        <section className="space-y-1">
          <h2 className="text-xl font-bold uppercase tracking-wide" style={{ color: "#0B4F4A" }}>
            Privacy Policy
          </h2>
          <p className="text-md text-gray-500 italic">
            Your privacy isn&apos;t an afterthought — it&apos;s part of how we build.
          </p>
          <p className="text-md text-black leading-relaxed">
            Novi is designed to help solo travelers move through decisions faster and explore with
            more confidence. To do that well, we need to understand how you interact with the app.
            We take that responsibility seriously. We collect only what we need, we never sell your
            data, and we&apos;re transparent about everything we do with it.
          </p>
        </section>

        <section className="space-y-1">
          <h3 className="text-md font-bold text-black uppercase tracking-wide">What We Collect</h3>
          <div>
            <p className="text-md text-black mb-1">You share with us:</p>
            <ul className="space-y-1 pl-4">
              {["Your first name", "Travel preferences — dietary needs, activity interests, budget range, and what you're looking to do"].map((item, i) => (
                <li key={i} className="text-md text-black flex gap-2">
                  <span className="text-black flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <hr className="border-white" />
          <div>
            <p className="text-md text-black mb-1">We collect automatically:</p>
            <ul className="space-y-1 pl-4">
              {[
                "Location data, to surface recommendations near you",
                "Behavioral data — scroll patterns, tap activity, time on screen, and revisit behavior. This is how Novi detects decision paralysis and knows when to step in",
                "Device type and operating system",
              ].map((item, i) => (
                <li key={i} className="text-md text-black flex gap-2">
                  <span className="text-black flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <hr className="border-white" />
          <div>
            <p className="text-md text-black mb-1">We never collect:</p>
            <ul className="space-y-1 pl-4">
              {["Payment information", "Passport or ID details", "Data from any third-party apps"].map((item, i) => (
                <li key={i} className="text-md text-black flex gap-2">
                  <span className="text-black flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>


        <section className="space-y-1">
          <h3 className="text-md font-bold text-black uppercase tracking-wide">How We Use It</h3>
          <p className="text-md text-black mb-1">We use your information to:</p>
          <ul className="space-y-1 pl-4">
            {[
              "Deliver personalized recommendations based on your location and preferences",
              "Detect freeze moments and surface timely nudges",
              "Improve Novi's recommendation engine and detection accuracy",
              "Keep you updated on your beta experience and product changes",
              "Maintain the security and performance of the app",
            ].map((item, i) => (
              <li key={i} className="text-md text-black flex gap-2">
                <span className="text-black flex-shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-md text-black mb-1">Your interaction data during beta also helps us understand how Novi is performing so we can make it better before wider launch.</p>
        </section>

        <section className="space-y-1">
          <h3 className="text-md font-bold text-black uppercase tracking-wide">Data security</h3>
          <p className="text-md text-black mb-1">We take reasonable technical and organizational measures to protect your information from unauthorized access, loss, or misuse. Your data is stored securely and accessible only to the Novi core team. No method of transmission or storage is 100% secure, but we're committed to protecting your information and will notify you promptly if a breach ever occurs.</p>
        </section>

        <section className="space-y-1">
          <h3 className="text-md font-bold text-black uppercase tracking-wide">your rights</h3>
          <p className="text-md text-black mb-1">You can at any time:</p>
          <ul className="space-y-1 pl-4">
            {[
              "Access the information we hold about you",
              "Request corrections to any inaccurate data",
              "Request deletion of your data",
              "Opt out of communications from us",
              "Withdraw consent to data collection — this will end your beta access",
            ].map((item, i) => (
              <li key={i} className="text-md text-black flex gap-2">
                <span className="text-black flex-shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-md text-black mb-1">To exercise any of these rights, email us at{" "}
            <a href="mailto:noviteam.ai@gmail.com" className="underline" style={{ color: "#0B4F4A" }}>
              noviteam.ai@gmail.com
            </a></p>
        </section>

        <section className="space-y-1">
          <h3 className="text-md font-bold text-black uppercase tracking-wide">Updates to this policy</h3>
          <p className="text-md text-black mb-1">We may update this policy as Novi evolves. If we make material changes, we'll let you know via email before they take effect. The date at the top of this page will always reflect the latest version.</p>
        </section>

        <hr className="border-1 border-gray-300" />

        <section className="space-y-1">
          <h2 className="text-xl font-bold uppercase tracking-wide" style={{ color: "#0B4F4A" }}>
            TERMS OF service
          </h2>
          <p className="text-md text-black leading-relaxed">
            By using Novi during the beta period, you agree to the following.
          </p>
        </section>

        <section className="space-y-1">
          <h3 className="text-md font-bold text-black uppercase tracking-wide">Beta participation</h3>
          <p className="text-md text-black mb-1"> Novi is a work in progress. You may encounter bugs, incomplete features, or unexpected behavior. By joining, you acknowledge you're using a pre-release product and agree to share feedback to help us improve.</p>
        </section>

        <section className="space-y-1">
          <h3 className="text-md font-bold text-black uppercase tracking-wide">How you can use Novi</h3>
          <p className="text-md text-black mb-1">Novi is for personal travel decisions — nothing else. You agree not to:</p>
          <ul className="space-y-1 pl-4">
            {[
              "Attempt to reverse engineer, copy, or exploit any part of the app",
              "Use Novi in any way that could harm other users or our team",
              "Share your beta access with others without permission",
            ].map((item, i) => (
              <li key={i} className="text-md text-black flex gap-2">
                <span className="text-black flex-shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          </section>

          <section className="space-y-1">
            <h3 className="text-md font-bold text-black uppercase tracking-wide">Intellectual property</h3>
            <p className="text-md text-black mb-1"> All content, design, and technology within Novi belongs to the Novi team. These terms don't grant you ownership of any part of the app.</p>
          </section>

          <section className="space-y-1">
            <h3 className="text-md font-bold text-black uppercase tracking-wide">No warranties</h3>
            <p className="text-md text-black mb-1"> Novi is provided as-is during beta. We make no guarantees about uptime, recommendation accuracy, or fitness for any particular purpose. Use it at your own discretion.</p>
          </section>


          <section className="space-y-1">
            <h3 className="text-md font-bold text-black uppercase tracking-wide">Limitation of liability</h3>
            <p className="text-md text-black mb-1"> To the extent permitted by law, the Novi team isn't liable for any indirect, incidental, or consequential damages from your use of the app during this period.</p>
          </section>

          <section className="space-y-1">
            <h3 className="text-md font-bold text-black uppercase tracking-wide">Governing law</h3>
            <p className="text-md text-black mb-1"> These terms are governed by the laws of the State of California.</p>
          </section>

        <section className="space-y-2">
          <h3 className="text-md font-bold text-black uppercase tracking-wide">Questions?</h3>
          <p className="text-md text-black"> We genuinely want to hear from you — whether it's a concern, a request, or just feedback.
            <a href="mailto:noviteam.ai@gmail.com" className="underline" style={{ color: "#0B4F4A" }}>
              noviteam.ai@gmail.com
            </a>
            
          </p>
          <hr className="border-4 border-white"/>
          <p className="text-sm text-gray-700">Last updated March 2026</p>
        </section>

        <hr className="border-4 border-white"/>
      </div>
    </div>
  );
}
