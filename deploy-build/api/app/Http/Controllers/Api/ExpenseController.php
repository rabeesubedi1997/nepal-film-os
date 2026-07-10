<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Traits\FilmPermissionTrait;
use App\Models\Expense;
use App\Models\Budget;
use App\Models\FilmUser;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    use FilmPermissionTrait;
    /**
     * Get all expenses and department budgets.
     */
    public function index(Request $request, $filmId)
    {
        $expenses = Expense::where('film_id', $filmId)
            ->with(['submitter', 'approver'])
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        $budgets = Budget::where('film_id', $filmId)->get();

        return response()->json([
            'expenses' => $expenses,
            'budgets' => $budgets,
        ]);
    }

    /**
     * Store a new expense log.
     */
    public function storeExpense(Request $request, $filmId)
    {
        $this->requireCan($request, $filmId, 'expense.create');

        $validated = $request->validate([
            'department_id' => 'required|string',
            'category' => 'required|string',
            'amount' => 'required|numeric',
            'currency' => 'nullable|string',
            'description' => 'nullable|string',
            'date' => 'required|date',
            'po_number' => 'nullable|string',
            'payment_method' => 'nullable|string',
            'receipt_image' => 'nullable|string', // Base64 or standard string url
        ]);

        $user = $request->user();

        $expense = Expense::create([
            'film_id' => $filmId,
            'department_id' => $validated['department_id'],
            'category' => $validated['category'],
            'amount' => $validated['amount'],
            'currency' => $validated['currency'] ?? 'NPR',
            'description' => $validated['description'] ?? null,
            'receipt_image' => $validated['receipt_image'] ?? null,
            'date' => $validated['date'],
            'submitted_by' => $user->id,
            'approved_by' => null,
            'status' => 'Pending',
            'po_number' => $validated['po_number'] ?? null,
            'payment_method' => $validated['payment_method'] ?? 'Cash',
        ]);

        return response()->json($expense->load('submitter'), 201);
    }

    /**
     * Create or update a department budget.
     */
    public function storeBudget(Request $request, $filmId)
    {
        $validated = $request->validate([
            'department_id' => 'required|string',
            'category' => 'required|string',
            'budgeted_amount' => 'required|numeric',
            'currency' => 'nullable|string',
        ]);

        $filmUser = FilmUser::where('film_id', $filmId)
            ->where('user_id', $request->user()->id)
            ->first();

        $canManageBudget = $filmUser && (
            $filmUser->isFilmAdmin() ||
            $filmUser->hasPermission('budget.manage') ||
            $request->user()->is_super_admin
        );

        if (!$canManageBudget) {
            return response()->json(['message' => 'Unauthorized to modify budget.'], 403);
        }

        $budget = Budget::updateOrCreate(
            [
                'film_id' => $filmId,
                'department_id' => $validated['department_id'],
                'category' => $validated['category']
            ],
            [
                'budgeted_amount' => $validated['budgeted_amount'],
                'currency' => $validated['currency'] ?? 'NPR'
            ]
        );

        return response()->json($budget);
    }

    /**
     * Update an expense.
     */
    public function updateExpense(Request $request, $filmId, $id)
    {
        $this->requireCan($request, $filmId, 'expense.edit');
        $expense = Expense::where('film_id', $filmId)->findOrFail($id);

        $validated = $request->validate([
            'department_id' => 'nullable|string',
            'category' => 'nullable|string',
            'amount' => 'nullable|numeric',
            'currency' => 'nullable|string',
            'description' => 'nullable|string',
            'date' => 'nullable|date',
            'po_number' => 'nullable|string',
            'payment_method' => 'nullable|string',
        ]);

        $expense->update($validated);

        return response()->json($expense->load(['submitter', 'approver']));
    }

    /**
     * Delete an expense.
     */
    public function destroyExpense(Request $request, $filmId, $id)
    {
        $this->requireCan($request, $filmId, 'expense.delete');
        $expense = Expense::where('film_id', $filmId)->findOrFail($id);
        $expense->delete();

        return response()->json(['message' => 'Expense deleted successfully.']);
    }

    /**
     * Delete a budget item.
     */
    public function destroyBudget(Request $request, $filmId, $id)
    {
        $this->requireCan($request, $filmId, 'budget.manage');
        $budget = Budget::where('film_id', $filmId)->findOrFail($id);
        $budget->delete();

        return response()->json(['message' => 'Budget item deleted successfully.']);
    }

    /**
     * Approve or reject a logged expense.
     */
    public function approveExpense(Request $request, $filmId, $id)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:Approved,Rejected,Paid',
            'rejection_reason' => 'required_if:status,Rejected|nullable|string',
        ]);

        $expense = Expense::where('film_id', $filmId)->findOrFail($id);

        $filmUser = FilmUser::where('film_id', $filmId)
            ->where('user_id', $request->user()->id)
            ->first();

        $canApprove = $filmUser && (
            $filmUser->isFilmAdmin() ||
            $filmUser->hasPermission('expense.approve') ||
            $request->user()->is_super_admin
        );

        if (!$canApprove) {
            return response()->json(['message' => 'Unauthorized to approve expenses.'], 403);
        }

        $updateData = [
            'status' => $validated['status'],
            'approved_by' => $request->user()->id,
        ];

        if ($validated['status'] === 'Rejected') {
            $updateData['rejection_reason'] = $validated['rejection_reason'];
        }

        $expense->update($updateData);

        return response()->json($expense->load(['submitter', 'approver']));
    }
}
