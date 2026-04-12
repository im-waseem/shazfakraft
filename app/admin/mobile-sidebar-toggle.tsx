'use client'

export default function MobileSidebarToggle() {
  return (
    <button
      onClick={() => {
        // Toggle sidebar on mobile
        const sidebar = document.querySelector('.fixed.inset-y-0.left-0')
        sidebar?.classList.toggle('hidden')
      }}
      className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500"
    >
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  )
}