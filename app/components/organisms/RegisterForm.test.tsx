// src/components/organisms/RegisterForm/RegisterForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterForm } from './RegisterForm';

// Mock subcomponents
vi.mock('~/components/molecules/FormField', () => ({
    FormField: ({ label, type, id, value, onChange, placeholder, required, autoComplete }: any) => (
        <div data-testid={`form-field-${id}`}>
            <label htmlFor={id}>{label}</label>
            <input
                type={type}
                id={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                autoComplete={autoComplete}
                data-testid={`input-${id}`}
            />
        </div>
    )
}));

vi.mock('~/components/atoms/Button', () => ({
    Button: ({ type, variant, size, isLoading, className, children, ...props }: any) => (
        <button
            type={type}
            data-variant={variant}
            data-size={size}
            data-loading={isLoading}
            className={className}
            {...props}
        >
            {isLoading ? 'Cargando...' : children}
        </button>
    )
}));

describe('RegisterForm', () => {
    const mockOnSubmit = vi.fn();

    beforeEach(() => {
        mockOnSubmit.mockClear();
        mockOnSubmit.mockResolvedValue(undefined);
    });

    it('renders all form fields', () => {
        render(<RegisterForm onSubmit={mockOnSubmit} />);

        expect(screen.getByTestId('form-field-name')).toBeInTheDocument();
        expect(screen.getByTestId('form-field-email')).toBeInTheDocument();
        expect(screen.getByTestId('form-field-password')).toBeInTheDocument();
        expect(screen.getByTestId('form-field-confirmPassword')).toBeInTheDocument();
    });

    it('renders form title', () => {
        render(<RegisterForm onSubmit={mockOnSubmit} />);
        expect(screen.getByText('Crear Cuenta')).toBeInTheDocument();
    });

    it('renders submit button', () => {
        render(<RegisterForm onSubmit={mockOnSubmit} />);
        expect(screen.getByText('🚀 Crear cuenta')).toBeInTheDocument();
    });

    it('updates name field value on input', () => {
        render(<RegisterForm onSubmit={mockOnSubmit} />);
        const nameInput = screen.getByTestId('input-name') as HTMLInputElement;

        fireEvent.change(nameInput, { target: { value: 'Juan Pérez' } });
        expect(nameInput.value).toBe('Juan Pérez');
    });

    it('updates email field value on input', () => {
        render(<RegisterForm onSubmit={mockOnSubmit} />);
        const emailInput = screen.getByTestId('input-email') as HTMLInputElement;

        fireEvent.change(emailInput, { target: { value: 'juan@example.com' } });
        expect(emailInput.value).toBe('juan@example.com');
    });

    it('updates password field value on input', () => {
        render(<RegisterForm onSubmit={mockOnSubmit} />);
        const passwordInput = screen.getByTestId('input-password') as HTMLInputElement;

        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        expect(passwordInput.value).toBe('password123');
    });

    it('updates confirm password field value on input', () => {
        render(<RegisterForm onSubmit={mockOnSubmit} />);
        const confirmPasswordInput = screen.getByTestId('input-confirmPassword') as HTMLInputElement;

        fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
        expect(confirmPasswordInput.value).toBe('password123');
    });

    it('toggles password visibility', () => {
        render(<RegisterForm onSubmit={mockOnSubmit} />);
        const passwordInput = screen.getByTestId('input-password') as HTMLInputElement;
        const toggleButtons = screen.getAllByRole('button', { name: /👁️/ });
        const passwordToggle = toggleButtons[0];

        expect(passwordInput.type).toBe('password');

        fireEvent.click(passwordToggle);
        expect(passwordInput.type).toBe('text');

        fireEvent.click(passwordToggle);
        expect(passwordInput.type).toBe('password');
    });

    it('toggles confirm password visibility', () => {
        render(<RegisterForm onSubmit={mockOnSubmit} />);
        const confirmPasswordInput = screen.getByTestId('input-confirmPassword') as HTMLInputElement;
        const toggleButtons = screen.getAllByRole('button', { name: /👁️/ });
        const confirmPasswordToggle = toggleButtons[1];

        expect(confirmPasswordInput.type).toBe('password');

        fireEvent.click(confirmPasswordToggle);
        expect(confirmPasswordInput.type).toBe('text');
    });

    it('shows password strength indicator when typing password', () => {
        render(<RegisterForm onSubmit={mockOnSubmit} />);
        const passwordInput = screen.getByTestId('input-password');

        fireEvent.change(passwordInput, { target: { value: '12345' } });
        expect(screen.getByText('❌ Muy débil')).toBeInTheDocument();
    });

    it('shows weak password strength for short passwords', () => {
        render(<RegisterForm onSubmit={mockOnSubmit} />);
        const passwordInput = screen.getByTestId('input-password');

        fireEvent.change(passwordInput, { target: { value: '1234567' } });
        expect(screen.getByText('⚠️ Débil')).toBeInTheDocument();
    });

    it('shows strong password strength for complex passwords', () => {
        render(<RegisterForm onSubmit={mockOnSubmit} />);
        const passwordInput = screen.getByTestId('input-password');

        fireEvent.change(passwordInput, { target: { value: 'Password123' } });
        expect(screen.getByText('✅ Fuerte')).toBeInTheDocument();
    });

    it('shows acceptable password strength for medium passwords', () => {
        render(<RegisterForm onSubmit={mockOnSubmit} />);
        const passwordInput = screen.getByTestId('input-password');

        fireEvent.change(passwordInput, { target: { value: 'password' } });
        expect(screen.getByText('⚠️ Aceptable')).toBeInTheDocument();
    });

    it('shows error when passwords do not match', () => {
        render(<RegisterForm onSubmit={mockOnSubmit} />);
        const passwordInput = screen.getByTestId('input-password');
        const confirmPasswordInput = screen.getByTestId('input-confirmPassword');

        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });

        expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    });

    it('shows success when passwords match', () => {
        render(<RegisterForm onSubmit={mockOnSubmit} />);
        const passwordInput = screen.getByTestId('input-password');
        const confirmPasswordInput = screen.getByTestId('input-confirmPassword');

        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

        expect(screen.getByText('Las contraseñas coinciden')).toBeInTheDocument();
    });

    it('does not show password match indicator when confirmPassword is empty', () => {
        render(<RegisterForm onSubmit={mockOnSubmit} />);
        const passwordInput = screen.getByTestId('input-password');

        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        expect(screen.queryByText('Las contraseñas no coinciden')).not.toBeInTheDocument();
        expect(screen.queryByText('Las contraseñas coinciden')).not.toBeInTheDocument();
    });

    it('renders terms and conditions links', () => {
        render(<RegisterForm onSubmit={mockOnSubmit} />);

        expect(screen.getByText(/Al registrarte, aceptas nuestros/)).toBeInTheDocument();
        expect(screen.getByText('Términos y Condiciones')).toBeInTheDocument();
        expect(screen.getByText('Política de Privacidad')).toBeInTheDocument();
    });

    it('calls onSubmit with correct data when form is submitted', async () => {
        render(<RegisterForm onSubmit={mockOnSubmit} />);

        const nameInput = screen.getByTestId('input-name');
        const emailInput = screen.getByTestId('input-email');
        const passwordInput = screen.getByTestId('input-password');
        const confirmPasswordInput = screen.getByTestId('input-confirmPassword');
        const submitButton = screen.getByText('🚀 Crear cuenta');

        fireEvent.change(nameInput, { target: { value: 'Juan Pérez' } });
        fireEvent.change(emailInput, { target: { value: 'juan@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'Password123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'Password123' } });

        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith({
                name: 'Juan Pérez',
                email: 'juan@example.com',
                password: 'Password123',
                confirmPassword: 'Password123'
            });
        });
    });

    it('shows loading state during submission', async () => {
        mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

        render(<RegisterForm onSubmit={mockOnSubmit} />);

        const nameInput = screen.getByTestId('input-name');
        const emailInput = screen.getByTestId('input-email');
        const passwordInput = screen.getByTestId('input-password');
        const confirmPasswordInput = screen.getByTestId('input-confirmPassword');
        const submitButton = screen.getByText('🚀 Crear cuenta');

        fireEvent.change(nameInput, { target: { value: 'Juan Pérez' } });
        fireEvent.change(emailInput, { target: { value: 'juan@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'Password123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'Password123' } });

        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Cargando...')).toBeInTheDocument();
        });
    });

    it('handles submission errors gracefully', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        mockOnSubmit.mockRejectedValue(new Error('Submission failed'));

        render(<RegisterForm onSubmit={mockOnSubmit} />);

        const nameInput = screen.getByTestId('input-name');
        const emailInput = screen.getByTestId('input-email');
        const passwordInput = screen.getByTestId('input-password');
        const confirmPasswordInput = screen.getByTestId('input-confirmPassword');
        const submitButton = screen.getByText('🚀 Crear cuenta');

        fireEvent.change(nameInput, { target: { value: 'Juan Pérez' } });
        fireEvent.change(emailInput, { target: { value: 'juan@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'Password123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'Password123' } });

        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(consoleError).toHaveBeenCalled();
        });

        consoleError.mockRestore();
    });

    it('prevents form submission by default', async () => {
        const mockPreventDefault = vi.fn();
        render(<RegisterForm onSubmit={mockOnSubmit} />);

        const form = screen.getByTestId('input-name').closest('form')!;

        fireEvent.submit(form, { preventDefault: mockPreventDefault });

        expect(mockPreventDefault).toHaveBeenCalled();
    });

    it('renders password strength bars correctly', () => {
        render(<RegisterForm onSubmit={mockOnSubmit} />);
        const passwordInput = screen.getByTestId('input-password');

        fireEvent.change(passwordInput, { target: { value: 'Password123' } });

        const strengthBars = screen.getByTestId('input-password')
            .closest('div')
            ?.parentElement
            ?.querySelectorAll('.h-2.flex-1.rounded');

        expect(strengthBars).toBeDefined();
    });

    it('has correct autocomplete attributes', () => {
        render(<RegisterForm onSubmit={mockOnSubmit} />);

        const nameInput = screen.getByTestId('input-name');
        const emailInput = screen.getByTestId('input-email');
        const passwordInput = screen.getByTestId('input-password');
        const confirmPasswordInput = screen.getByTestId('input-confirmPassword');

        expect(nameInput).toHaveAttribute('autocomplete', 'name');
        expect(emailInput).toHaveAttribute('autocomplete', 'email');
        expect(passwordInput).toHaveAttribute('autocomplete', 'new-password');
        expect(confirmPasswordInput).toHaveAttribute('autocomplete', 'new-password');
    });
});