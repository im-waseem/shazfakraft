'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Customer {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  avatar_url: string | null
  billing_address: any
  shipping_address: any
  total_orders: number
  total_spent: number
  last_order_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  email: string
}

export default function CustomersManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        email:auth_users!inner(email)
      `)
      .order('created_at', { ascending: false })

    if (data && !error) {
      setCustomers(data)
    }
    setLoading(false)
  }

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowDetails(true)
  }

  const getCustomerTier = (totalSpent: number) => {
    if (totalSpent >= 1000) return 'VIP'
    if (totalSpent >= 500) return 'Premium'
    if (totalSpent >= 100) return 'Regular'
    return 'New'
  }

  const getTierColor = (tier: string) => {
    const colors: { [key: string]: string } = {
      VIP: 'bg-purple-100 text-purple-800',
      Premium: 'bg-indigo-100 text-indigo-800',
      Regular: 'bg-blue-100 text-blue-800',
      New: 'bg-gray-100 text-gray-800'
    }
    return colors[tier] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Customers</h2>
        <p className="text-sm text-gray-500">View and manage customer information</p>
      </div>

      {showDetails && selectedCustomer && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Customer Details
            </h3>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Personal Information</h4>
              <div className="text-sm text-gray-600">
                <p>Name: {selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                <p>Email: {selectedCustomer.email}</p>
                <p>Phone: {selectedCustomer.phone || 'Not provided'}</p>
                <p>Customer Since: {new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Order Statistics</h4>
              <div className="text-sm text-gray-600">
                <p>Total Orders: {selectedCustomer.total_orders}</p>
                <p>Total Spent: ${selectedCustomer.total_spent.toFixed(2)}</p>
                <p>Last Order: {selectedCustomer.last_order_date ? new Date(selectedCustomer.last_order_date).toLocaleDateString() : 'Never'}</p>
                <p>Tier: <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTierColor(getCustomerTier(selectedCustomer.total_spent))}`}>
                  {getCustomerTier(selectedCustomer.total_spent)}
                </span></p>
              </div>
            </div>

            {selectedCustomer.billing_address && (
              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-900 mb-2">Billing Address</h4>
                <div className="text-sm text-gray-600">
                  <p>{selectedCustomer.billing_address.street}</p>
                  <p>{selectedCustomer.billing_address.city}, {selectedCustomer.billing_address.state} {selectedCustomer.billing_address.zip}</p>
                  <p>{selectedCustomer.billing_address.country}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => {
                const tier = getCustomerTier(customer.total_spent)
                return (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {customer.avatar_url ? (
                          <img
                            src={customer.avatar_url}
                            alt={`${customer.first_name} ${customer.last_name}`}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 font-medium">
                              {customer.first_name?.charAt(0)}{customer.last_name?.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.first_name} {customer.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{customer.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{customer.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.total_orders}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${customer.total_spent.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTierColor(tier)}`}>
                        {tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(customer)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}