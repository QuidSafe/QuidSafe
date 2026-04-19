import Head from 'expo-router/head';

export function HeadMeta() {
  return (
    <Head>
      <title>QuidSafe - Tax Tracking for UK Sole Traders | MTD Compliant</title>
      <meta name="description" content="QuidSafe connects to your bank via Open Banking, auto-categorises transactions with AI, and tells you exactly what to set aside for HMRC. Making Tax Digital compliant. Free 30-day trial. £7.99/month." />
      <meta name="keywords" content="sole trader tax, UK tax tracking, Making Tax Digital, MTD software, HMRC tax calculator, self-assessment tax, sole trader expenses, Open Banking tax app, auto categorise expenses, tax set aside calculator, National Insurance calculator, Class 4 NI, income tax calculator UK, quarterly tax submissions, TrueLayer, sole trader accounting" />
      <meta name="author" content="QuidSafe Ltd" />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="theme-color" content="#FFFFFF" />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
      <link rel="canonical" href="https://quidsafe.uk" />

      <meta property="og:site_name" content="QuidSafe" />
      <meta property="og:title" content="QuidSafe - Smart Tax Tracking for UK Sole Traders" />
      <meta property="og:description" content="Connect your bank, auto-categorise expenses with AI, and know exactly what to set aside for HMRC. MTD compliant. Free 30-day trial." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://quidsafe.uk" />
      <meta property="og:locale" content="en_GB" />
      <meta property="og:image" content="https://quidsafe.uk/assets/images/icon.png" />
      <meta property="og:image:width" content="1024" />
      <meta property="og:image:height" content="1024" />
      <meta property="og:image:alt" content="QuidSafe shield logo with pound symbol" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="QuidSafe - Tax Tracking for UK Sole Traders" />
      <meta name="twitter:description" content="Connect your bank, auto-categorise expenses with AI, and know exactly what to set aside for HMRC. MTD compliant." />
      <meta name="twitter:image" content="https://quidsafe.uk/assets/images/icon.png" />

      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="QuidSafe" />
      <meta name="application-name" content="QuidSafe" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="msapplication-TileColor" content="#FFFFFF" />
      <link rel="icon" type="image/png" href="/assets/images/favicon.png" />
      <link rel="apple-touch-icon" href="/assets/images/icon.png" />
      <link rel="manifest" href="/manifest.json" />

      <meta name="geo.region" content="GB" />
      <meta name="geo.placename" content="United Kingdom" />
      <meta name="ICBM" content="51.5074, -0.1278" />
      <meta name="DC.language" content="en-GB" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "QuidSafe",
        "description": "QuidSafe is a tax tracking app built for UK sole traders. It connects to your bank via Open Banking, auto-categorises transactions with AI, and tells you exactly how much to set aside for HMRC - updated in real time. Making Tax Digital (MTD) compliant.",
        "url": "https://quidsafe.uk",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "iOS, Android, Web",
        "offers": { "@type": "Offer", "price": "7.99", "priceCurrency": "GBP", "priceValidUntil": "2027-12-31", "availability": "https://schema.org/InStock" },
        "featureList": [
          "Open Banking integration via TrueLayer (FCA authorised AISP)",
          "AI auto-categorisation of transactions",
          "Real-time Income Tax and National Insurance calculator",
          "Making Tax Digital (MTD) quarterly submissions to HMRC",
          "Monthly tax set-aside calculator",
          "Professional invoice creation and tracking",
          "AES-256 encryption for bank-grade security",
          "Full CSV data export",
          "Works with Barclays, HSBC, Lloyds, NatWest, Monzo, Starling, Revolut, Nationwide"
        ],
        "screenshot": "https://quidsafe.uk/assets/images/icon.png",
        "author": { "@type": "Organization", "name": "QuidSafe Ltd", "url": "https://quidsafe.uk" }
      }) }} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "What is QuidSafe?", "acceptedAnswer": { "@type": "Answer", "text": "QuidSafe is a tax tracking app built specifically for UK sole traders. It connects to your bank via Open Banking, auto-categorises your transactions with AI, and tells you exactly how much to set aside for HMRC - updated in real time." } },
          { "@type": "Question", "name": "Is my bank data safe with QuidSafe?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. QuidSafe uses AES-256 encryption (the same standard used by banks), Open Banking is regulated by the FCA, and we only ever have read-only access to your transactions. We can never move money or make payments from your account." } },
          { "@type": "Question", "name": "What is Making Tax Digital and do I need it?", "acceptedAnswer": { "@type": "Answer", "text": "Making Tax Digital (MTD) for Income Tax requires sole traders to keep digital records and submit quarterly updates to HMRC. It becomes mandatory from April 2026 for income over £50,000 and April 2027 for income over £30,000. QuidSafe handles this automatically." } },
          { "@type": "Question", "name": "How much does QuidSafe cost?", "acceptedAnswer": { "@type": "Answer", "text": "QuidSafe is £7.99/month or £79.99/year (save 17%) - all prices include VAT. Every plan includes all features - AI categorisation, MTD submissions, unlimited bank accounts, and more. VAT-registered sole traders can reclaim VAT. Start with a free 30-day trial, no credit card required." } },
          { "@type": "Question", "name": "What banks does QuidSafe support?", "acceptedAnswer": { "@type": "Answer", "text": "QuidSafe supports all major UK banks through TrueLayer Open Banking, including Barclays, HSBC, Lloyds, NatWest, Monzo, Starling, Nationwide, Revolut, and many more." } }
        ]
      }) }} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "QuidSafe",
        "legalName": "QuidSafe Ltd",
        "url": "https://quidsafe.uk",
        "logo": "https://quidsafe.uk/assets/images/icon.png",
        "description": "Smart tax tracking for UK sole traders. Open Banking, AI categorisation, MTD compliant.",
        "foundingDate": "2025",
        "areaServed": { "@type": "Country", "name": "United Kingdom" },
        "knowsAbout": ["sole trader tax", "Making Tax Digital", "HMRC", "self-assessment", "National Insurance", "Open Banking", "expense categorisation"]
      }) }} />

      <script defer data-domain="quidsafe.uk" src="https://plausible.io/js/script.js" />

      <link
        href="https://fonts.googleapis.com/css2?family=Lexend:wght@600&family=Source+Sans+3:wght@400;600&family=JetBrains+Mono:wght@400;600&family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
    </Head>
  );
}
