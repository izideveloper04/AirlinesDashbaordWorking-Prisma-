// components/FaqSection.tsx
type Faq = { question: string; answer: string };

type Props = {
    faqs:     Faq[];
    pageTitle: string;
};

export default function FaqSection({ faqs, pageTitle }: Props) {
    if (!faqs || faqs.length === 0) return null;

    // Filter out empty FAQs
    const validFaqs = faqs.filter(f => f.question.trim() && f.answer.trim());
    if (validFaqs.length === 0) return null;

    // JSON-LD schema for Google
    const schema = {
        '@context':  'https://schema.org',
        '@type':     'FAQPage',
        'mainEntity': validFaqs.map(faq => ({
            '@type':          'Question',
            'name':           faq.question,
            'acceptedAnswer': {
                '@type': 'Answer',
                'text':  faq.answer,
            },
        })),
    };

    return (
        <>
            {/* JSON-LD for Google */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />

            {/* Visual FAQ section */}
            <section className="faq-section">
                <h2 className="faq-heading">Frequently Asked Questions</h2>
                <div className="faq-list">
                    {validFaqs.map((faq, i) => (
                        <details key={i} className="faq-item">
                            <summary className="faq-question">
                                {faq.question}
                            </summary>
                            <div className="faq-answer">
                                {faq.answer}
                            </div>
                        </details>
                    ))}
                </div>
            </section>
        </>
    );
}