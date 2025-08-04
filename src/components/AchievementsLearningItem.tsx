import { StatusBadge, StatusType } from "./StatusBadge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { CommentEditor } from "./CommentEditor";
import { StatusItemData } from "./StatusItem";
import { SubsectionMetadata } from "./SubsectionMetadataDialog";

interface AchievementsLearningItemProps {
  item: StatusItemData;
  onStatusChange?: (id: string, status: StatusType) => void;
  onCustomFieldChange?: (id: string, field: string, value: string) => void;
  onMetadataChange?: (id: string, metadata: SubsectionMetadata) => void;
  attendees?: string[];
  readOnly?: boolean;
}

export const AchievementsLearningItem = ({
  item,
  onStatusChange,
  onCustomFieldChange,
  onMetadataChange,
  attendees = [],
  readOnly = false
}: AchievementsLearningItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingAchievements, setIsEditingAchievements] = useState(false);
  const [isEditingChallenges, setIsEditingChallenges] = useState(false);
  const [isEditingLessonsLearned, setIsEditingLessonsLearned] = useState(false);

  const handleAchievementsSubmit = (value: string) => {
    onCustomFieldChange?.(item.id, "achievements", value);
    setIsEditingAchievements(false);
  };

  const handleChallengesSubmit = (value: string) => {
    onCustomFieldChange?.(item.id, "challenges", value);
    setIsEditingChallenges(false);
  };

  const handleLessonsLearnedSubmit = (value: string) => {
    onCustomFieldChange?.(item.id, "lessonsLearned", value);
    setIsEditingLessonsLearned(false);
  };

  const getStatusBackgroundClass = (status: StatusType) => {
    switch (status) {
      case "red":
        return "bg-red-50 border-red-200";
      case "amber":
        return "bg-amber-50 border-amber-200";
      case "green":
        return "bg-green-50 border-green-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusBackgroundClass(item.status)} transition-all duration-200`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          <StatusBadge status={item.status} />
          <h3 className="font-semibold text-gray-900">{item.title}</h3>
        </div>
        <div className="text-sm text-gray-500">
          {item.lastReviewed && `Last updated: ${item.lastReviewed}`}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-6">
          {/* Achievements Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                Achievements
              </h4>
              {!readOnly && !isEditingAchievements && (
                <button
                  onClick={() => setIsEditingAchievements(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
            {isEditingAchievements ? (
              <CommentEditor
                initialValue={item.customFields?.achievements || ""}
                onSubmit={handleAchievementsSubmit}
                onCancel={() => setIsEditingAchievements(false)}
                placeholder="Add achievements and successes..."
              />
            ) : (
              <div className="text-sm text-gray-600 bg-white p-3 rounded border min-h-[60px]">
                {item.customFields?.achievements || "No achievements recorded yet."}
              </div>
            )}
          </div>

          {/* Challenges Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                Challenges
              </h4>
              {!readOnly && !isEditingChallenges && (
                <button
                  onClick={() => setIsEditingChallenges(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
            {isEditingChallenges ? (
              <CommentEditor
                initialValue={item.customFields?.challenges || ""}
                onSubmit={handleChallengesSubmit}
                onCancel={() => setIsEditingChallenges(false)}
                placeholder="Add challenges and areas for improvement..."
              />
            ) : (
              <div className="text-sm text-gray-600 bg-white p-3 rounded border min-h-[60px]">
                {item.customFields?.challenges || "No challenges recorded yet."}
              </div>
            )}
          </div>

          {/* Lessons Learned Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                Lessons Learned
              </h4>
              {!readOnly && !isEditingLessonsLearned && (
                <button
                  onClick={() => setIsEditingLessonsLearned(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
            {isEditingLessonsLearned ? (
              <CommentEditor
                initialValue={item.customFields?.lessonsLearned || ""}
                onSubmit={handleLessonsLearnedSubmit}
                onCancel={() => setIsEditingLessonsLearned(false)}
                placeholder="Add lessons learned and key takeaways..."
              />
            ) : (
              <div className="text-sm text-gray-600 bg-white p-3 rounded border min-h-[60px]">
                {item.customFields?.lessonsLearned || "No lessons learned recorded yet."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};