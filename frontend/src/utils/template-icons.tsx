// utils/template-icons.tsx
import {
	HiOutlineDocument,
	HiOutlineTemplate,
	HiOutlineChartBar,
	HiOutlineMail,
	HiOutlineUsers,
	HiOutlineClipboardList,
	HiOutlineCalendar,
	HiOutlineBookOpen,
	HiOutlineCalculator,
	HiOutlineCurrencyDollar,
	HiOutlineOfficeBuilding,
	HiOutlineReceiptTax,
	HiOutlineTrendingUp,
	HiOutlineBriefcase,
	HiOutlineScale,
	HiOutlineEye,
	HiOutlineDesktopComputer,
	HiOutlineTable,
	HiOutlineClipboardCheck,
	HiOutlineClock,
	HiOutlineBookmark
} from "react-icons/hi";

const TEMPLATE_ICONS = {
	// General Document Types
	'document': <HiOutlineDocument size={18} />,
	'template': <HiOutlineTemplate size={18} />,
	'report': <HiOutlineChartBar size={18} />,
	'letter': <HiOutlineMail size={18} />,
	'meeting': <HiOutlineUsers size={18} />,
	'checklist': <HiOutlineClipboardList size={18} />,
	'calendar': <HiOutlineCalendar size={18} />,
	'book': <HiOutlineBookOpen size={18} />,

	// Financial & Business
	'chart': <HiOutlineChartBar size={18} />,
	'calculator': <HiOutlineCalculator size={18} />,
	'currency': <HiOutlineCurrencyDollar size={18} />,
	'bank': <HiOutlineOfficeBuilding size={18} />,
	'receipt': <HiOutlineReceiptTax size={18} />,
	'trend': <HiOutlineTrendingUp size={18} />,
	'briefcase': <HiOutlineBriefcase size={18} />,
	'scale': <HiOutlineScale size={18} />,
	'eye': <HiOutlineEye size={18} />,
	'presentation': <HiOutlineDesktopComputer size={18} />,
	'spreadsheet': <HiOutlineTable size={18} />,
	'contract': <HiOutlineClipboardCheck size={18} />,
	'clock': <HiOutlineClock size={18} />,
	'bookmark': <HiOutlineBookmark size={18} />,
} as const;

export type TemplateIconKey = keyof typeof TEMPLATE_ICONS;

export const getTemplateIcon = (iconKey: string): React.ReactElement => {
	return TEMPLATE_ICONS[iconKey as TemplateIconKey] || TEMPLATE_ICONS.template;
};

// Helper function to get all available icon keys
export const getAvailableIconKeys = (): TemplateIconKey[] => {
	return Object.keys(TEMPLATE_ICONS) as TemplateIconKey[];
};

// Helper function to get icon with custom size
export const getTemplateIconWithSize = (iconKey: string, size: number = 18): React.ReactElement => {
	const IconComponent = TEMPLATE_ICONS[iconKey as TemplateIconKey];
	if (!IconComponent) {
		return TEMPLATE_ICONS.template;
	}

	// Clone the icon with new size
	return React.cloneElement(IconComponent, { size });
};
