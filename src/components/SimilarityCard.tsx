import { useState, useCallback } from "react";
import { Fragrance } from "@/types";
import { AccordBarStack } from "./AccordBarStack";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Link } from "react-router-dom";

const LOCAL_KEY = "perfumisto_similarity_votes";

type Vote = "approved" | "disapproved";
type VoteMap = Record<string, { vote: Vote; approveCount: number; disapproveCount: number }>;

function getVoteMap(): VoteMap {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}"); } catch { return {}; }
}
function setVoteMap(map: VoteMap) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(map));
}

function makeKey(a: string, b: string) {
  return [a, b].sort().join("_");
}

interface SimilarityCardProps {
  fragrance: Fragrance;
  similarityPercent: number;
  sourceFragranceId?: string;
}

export function SimilarityCard({ fragrance, similarityPercent, sourceFragranceId }: SimilarityCardProps) {
  const pairKey = sourceFragranceId ? makeKey(sourceFragranceId, fragrance.id) : "";

  const [voteState, setVoteState] = useState(() => {
    if (!pairKey) return { vote: null as Vote | null, approveCount: 0, disapproveCount: 0 };
    const stored = getVoteMap()[pairKey];
    return stored ?? { vote: null as Vote | null, approveCount: 0, disapproveCount: 0 };
  });

  const handleVote = useCallback((newVote: Vote) => {
    if (!pairKey) return;
    setVoteState((prev) => {
      const wasVote = prev.vote;
      const toggling = wasVote === newVote;

      let { approveCount, disapproveCount } = prev;
      // Undo previous vote
      if (wasVote === "approved") approveCount = Math.max(0, approveCount - 1);
      else if (wasVote === "disapproved") disapproveCount = Math.max(0, disapproveCount - 1);
      // Apply new vote (unless toggling off)
      if (!toggling) {
        if (newVote === "approved") approveCount++;
        else disapproveCount++;
      }

      const next = {
        vote: toggling ? null : newVote,
        approveCount,
        disapproveCount,
      };

      const map = getVoteMap();
      if (next.vote === null && next.approveCount === 0 && next.disapproveCount === 0) {
        delete map[pairKey];
      } else {
        map[pairKey] = { vote: next.vote!, approveCount, disapproveCount };
      }
      setVoteMap(map);

      return next;
    });
  }, [pairKey]);

  const { vote, approveCount, disapproveCount } = voteState;

  return (
    <div className="glass rounded-xl p-4 space-y-3 h-full flex flex-col">
      <div className="flex items-start justify-between">
        <Link to={`/fragrance/${fragrance.id}`} className="hover:text-accent transition-colors">
          <h4 className="font-display font-semibold">{fragrance.name}</h4>
          <p className="text-xs text-muted-foreground">{fragrance.brand}</p>
        </Link>
        <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary/30 text-accent">
          {similarityPercent}% match
        </span>
      </div>

      <AccordBarStack accords={fragrance.main_accords.slice(0, 3)} size="sm" />

      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => handleVote("approved")}
          className={`flex-1 text-xs py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 ${
            vote === "approved"
              ? "bg-green-500/25 text-green-400 ring-1 ring-green-500/40"
              : "bg-primary/20 hover:bg-primary/30 text-foreground"
          }`}
        >
          <ThumbsUp size={12} className={vote === "approved" ? "fill-green-400" : ""} />
          Approve{approveCount > 0 ? ` (${approveCount})` : ""}
        </button>
        <button
          onClick={() => handleVote("disapproved")}
          className={`flex-1 text-xs py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 ${
            vote === "disapproved"
              ? "bg-red-500/25 text-red-400 ring-1 ring-red-500/40"
              : "bg-muted/30 hover:bg-muted/50 text-muted-foreground"
          }`}
        >
          <ThumbsDown size={12} className={vote === "disapproved" ? "fill-red-400" : ""} />
          Disapprove{disapproveCount > 0 ? ` (${disapproveCount})` : ""}
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground/60 text-center">
        Similarity score is community-verified
      </p>
    </div>
  );
}
