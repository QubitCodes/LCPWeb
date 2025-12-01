import AnimatedDivDown from "../animated_components/AnimatedDivDown";

interface PageTitleProps {
  title: string;
  description?: string;
}
const PageTitle = ({ title, description }: PageTitleProps) => {
  return (
    <AnimatedDivDown
      delay={0.1}
      className="text-xl text-page-titleColor font-semibold mt-1">
      {title}
      {description && (
        <AnimatedDivDown
          delay={0.2}
          className="text-base font-normal text-page-description text-gray-500">
          {description}
        </AnimatedDivDown>
      )}
    </AnimatedDivDown>
  );
};

export default PageTitle;
