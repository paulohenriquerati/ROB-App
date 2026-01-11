"use client";

interface BookDescriptionProps {
    description?: string;
}

export function BookDescription({ description }: BookDescriptionProps) {
    // Default description if none provided
    const displayDescription = description ||
        "Este livro oferece uma abordagem prática e abrangente ao seu tema. Com exemplos claros e explicações detalhadas, guia os leitores através dos conceitos fundamentais até às técnicas mais avançadas. Ideal para quem procura aprofundar os seus conhecimentos e aplicá-los em cenários do mundo real.";

    return (
        <div className="space-y-4 text-gray-700 leading-relaxed">
            {/* AI Translation Disclaimer - Now at top, immediately after action buttons */}
            <div className="bg-gray-50 border-l-4 border-[var(--oreilly-red)] px-4 py-3 mb-6">
                <p className="text-sm text-gray-600">
                    Este trabalho foi traduzido com recurso a IA. Agradecemos o teu feedback e comentários:{" "}
                    <a
                        href="mailto:translation-feedback@oreilly.com"
                        className="text-[var(--oreilly-red)] hover:underline font-medium"
                    >
                        translation-feedback@oreilly.com
                    </a>
                </p>
            </div>

            {/* About This Book Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Sobre Este Livro</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                    {displayDescription}
                </p>
            </div>

            {/* What You'll Learn Section */}
            <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">O Que Vais Aprender</h3>
                <ul className="space-y-2.5">
                    <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold mt-0.5">✓</span>
                        <span className="text-base text-gray-700">Dominar conceitos fundamentais de programação e boas práticas</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold mt-0.5">✓</span>
                        <span className="text-base text-gray-700">Compreender arquitetura de sistemas e padrões de design</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold mt-0.5">✓</span>
                        <span className="text-base text-gray-700">Aprender técnicas de depuração e otimização</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold mt-0.5">✓</span>
                        <span className="text-base text-gray-700">Construir projetos do mundo real passo a passo</span>
                    </li>
                </ul>
            </div>

            {/* Who This Book Is For Section */}
            <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Para Quem É Este Livro</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                    Desenvolvedores, engenheiros e profissionais técnicos que procuram expandir as suas competências e aplicar conhecimentos avançados em ambientes de produção.
                </p>
            </div>
        </div>
    );
}
