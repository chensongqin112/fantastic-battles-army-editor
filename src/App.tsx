import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { EditorPage } from './ui/EditorPage.tsx';
import { PrintPage } from './ui/PrintPage.tsx';

export default function App() {
    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={<EditorPage />} />
                <Route path="/print" element={<PrintPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </HashRouter>
    );
}
