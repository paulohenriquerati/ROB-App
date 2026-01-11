"use client";

export function PublisherFooter() {
    return (
        <section className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About the Publisher</h2>
            <p className="text-base text-gray-700 leading-relaxed">
                O&apos;Reilly&apos;s mission is to change the world by sharing the knowledge of innovators. For over 40 years, we&apos;ve
                inspired companies and individuals to do new things—and do things better—by providing them with the skills
                and understanding that&apos;s necessary for success.
            </p>
            <a
                href="#"
                className="inline-block mt-4 text-[var(--oreilly-red)] font-medium hover:underline"
            >
                More about O&apos;Reilly Media, Inc.
            </a>
        </section>
    );
}
