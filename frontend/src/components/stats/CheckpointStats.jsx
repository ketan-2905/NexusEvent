import React, { useState, useEffect } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import {
    ArrowLeft, Filter, Download, ArrowUp, ArrowDown, Users
} from "lucide-react";
import api from "../../utils/api";
import clsx from "clsx";
import { useNavigate, useParams } from "react-router-dom";

const CustomPieTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    return (
        <div className="bg-[#1c222b] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm shadow-lg flex gap-2">
            <p className="font-semibold">{payload[0].name}</p>
            <p className="text-blue-400">{payload[0].value}</p>
        </div>
    );
};


const CheckpointStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // UI State
    const [selectedAttributes, setSelectedAttributes] = useState([]); // Dynamic column
    const [compareMode, setCompareMode] = useState("NONE");
    const [compareTargetId, setCompareTargetId] = useState("");
    const [sortOrder, setSortOrder] = useState("asc");
    const [isSeparate, setIsSeparate] = useState(false);
    const [sortBy, setSortBy] = useState("");
    const [availableKeysForSort, setAvailableKeysForSort] = useState([]);
    const [availableKeys, setAvailableKeys] = useState([]);

    // Resources
    const [checkpoints, setCheckpoints] = useState([]);
    const navigate = useNavigate();

    const { eventId, checkpointId } = useParams()

    useEffect(() => {
        fetchCheckpoints();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkpointId, compareMode, compareTargetId]);

    const fetchCheckpoints = async () => {
        try {
            const res = await api.get(`/events/${eventId}/checkpoints`);
            setCheckpoints(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchStats = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                compareMode,
                compareTargetIds: compareTargetId
            });
            const res = await api.get(`/events/${eventId}/checkpoints/${checkpointId}/stats?${query.toString()}`);

            const normalize = (list = []) =>
                list.map(p => ({
                    ...p,
                    ...(p.data || {})
                }));
            setStats({
                ...res.data, lists: {
                    ...res.data.lists,
                    visited: normalize(res.data.lists.visited),
                    gap: normalize(res.data.lists.gap)
                }
            });
            setAvailableKeys(res.data.availableKeys);
            setAvailableKeysForSort([...res.data.availableKeys, "name", "teamName"]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !stats) return <div className="p-10 text-center text-slate-400">Loading stats...</div>;
    if (!stats) return <div className="text-center">No data available</div>;

    const { overviewGraph, lists, summary, checkpointName } = stats;

    // console.log("summary", summary);


    // Sorting Helper
    const sortList = (list) => {
        return [...list].sort((a, b) => {
            if (a?.[sortBy] === "-") {
                return 1;
            }
            if (b?.[sortBy] === "-") {
                return -1;
            }
            const valA = a?.[sortBy]?.toLowerCase() || "";
            const valB = b?.[sortBy]?.toLowerCase() || "";
            return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);

        });
    };

    let visitedList = [], gapList = [], notSeparatedList = [];

    if (isSeparate) {
        visitedList = sortList(lists.visited || []);
        gapList = sortList(lists.gap || []);
    } else {
        notSeparatedList = sortList([...lists.visited, ...lists.gap] || []);
    }
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/dashboard/event/${eventId}/checkpoints`)}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-300" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-white">{checkpointName} <span className="text-slate-500 font-normal">Details</span></h2>
                        <p className="text-slate-400 text-sm">Event-wide Overview & Details</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {/* Comparison Controls */}
                    <select
                        value={compareMode}
                        onChange={(e) => {
                            setCompareMode(e.target.value)
                            if (e.target.value === 'CHECKPOINT') {
                                setCompareTargetId(checkpoints[0].id)
                            }
                        }}
                        className="bg-slate-800 border border-white/10 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none"
                    >
                        <option value="NONE">No Comparison</option>
                        <option value="TOTAL">Vs Global (Not Visited)</option>
                        <option value="CHECKPOINT">Vs Other Checkpoint</option>
                    </select>

                    {compareMode === 'CHECKPOINT' && (
                        <select
                            value={compareTargetId}
                            onChange={(e) => setCompareTargetId(e.target.value)}
                            className="bg-slate-800 border border-white/10 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none max-w-[150px]"
                        >
                            {/* <option value="">Select Target...</option> */}
                            {checkpoints.filter(c => c.id !== checkpointId).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* MAIN GRAPH: All Checkpoints Overview */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold text-white mb-4">Event Checkpoint Flow</h3>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={overviewGraph} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                cursor={{ fill: '#ffffff05' }}
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                            />
                            <Legend />
                            <Bar dataKey="visited" name="Visited (Inside)" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="exited" name="Exited" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Circular Stats & Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stats Card */}
                <div className="md:col-span-1 bg-slate-900 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center">
                    <h3 className="text-white font-bold mb-4">Current Checkpoint Status</h3>
                    {compareMode === 'CHECKPOINT' ? (<div className="h-[200px] w-full max-w-[200px] relative">


                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Visited', value: summary.totalVisits },
                                        { name: 'Remaining', value: summary.totalGap }
                                    ]}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill="#3b82f6" />
                                    <Cell fill="#334155" />
                                </Pie>
                                {/* <Tooltip contentStyle={{ backgroundColor: '#1c222b', borderColor: '#334155', color: '#fff' }} /> */}
                                <Tooltip content={<CustomPieTooltip />} wrapperStyle={{ zIndex: 50 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                {summary.totalGap === 0 ? (<span className="text-3xl font-bold text-white">100%</span>) : (<span className="text-3xl font-bold text-white">{((summary.totalVisits / summary.totalGap) * 100).toFixed(2)}%</span>)}
                                <p className="text-xs text-slate-400">Completion</p>
                            </div>
                        </div>
                    </div>) : (<div className="h-[200px] w-full max-w-[200px] relative">


                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Visited', value: summary.totalVisits },
                                        { name: 'Remaining', value: summary.totalparticipant }
                                    ]}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill="#3b82f6" />
                                    <Cell fill="#334155" />
                                </Pie>
                                {/* <Tooltip contentStyle={{ backgroundColor: '#1c222b', borderColor: '#334155', color: '#fff' }} /> */}
                                <Tooltip content={<CustomPieTooltip />} wrapperStyle={{ zIndex: 50 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <span className="text-3xl font-bold text-white">{((summary.totalVisits / summary.totalparticipant) * 100).toFixed(2)}%</span>
                                <p className="text-xs text-slate-400">Completion</p>
                            </div>
                        </div>
                    </div>)}

                </div>

                {/* Controls & Legend */}
                <div className="w-full flex flex-col gap-2">
                    <div className="md:col-span-2 bg-slate-900 border border-white/10 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white font-bold">List Settings</h3>
                            <div className="flex gap-2">
                                <select
                                    onChange={(e) => {
                                        setSelectedAttributes(prev => [...prev, e.target.value])
                                        setAvailableKeys(prev => prev.filter(k => k !== e.target.value))
                                    }}
                                    className="bg-slate-800 border border-white/10 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none"
                                >
                                    <option value="">Select Attribute...</option>
                                    {availableKeys?.map(k => (
                                        <option key={k} value={k}>{k}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <p className="text-slate-400 text-sm">
                            Choose which participant attributes appear in the tables below.
                            Selected attributes will be shown as columns for both the
                            <strong> Visited / Exited</strong> and <strong>Gap</strong> lists,
                            helping you compare participant progress at this checkpoint.
                        </p>
                    </div>
                    <div className="md:col-span-2 bg-slate-900 border border-white/10 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white font-bold">Sort by</h3>
                            <div className="flex gap-2">
                                <select
                                    onChange={(e) => {
                                        setSortBy(e.target.value)
                                    }}
                                    className="bg-slate-800 border border-white/10 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none"
                                >
                                    <option value="">Select Attribute...</option>
                                    {availableKeysForSort?.map(k => (
                                        <option key={k} value={k}>{k}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                    className="bg-slate-800 p-2 rounded-lg text-slate-300 hover:text-white border border-white/10"
                                >
                                    {sortOrder === 'asc' ? <ArrowDown className="w-5 h-5" /> : <ArrowUp className="w-5 h-5" />}
                                </button>



                            </div>
                        </div>
                        <p className="text-slate-400 text-sm">
                            Control how participants are ordered in the tables.
                            Select an attribute to sort by and toggle the direction to view
                            results in ascending or descending order for easier analysis.
                        </p>
                    </div>
                </div>
            </div>

            {isSeparate ? (<div className="flex flex-col">
                {/* -- Left Table: Visited -- */}
                <div className="bg-slate-900 border border-white/10 overflow-hidden flex flex-col h-[500px]">
                    <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Users className="w-4 h-4" /> Visited <span className="underline">{checkpointName}</span> ({visitedList.length})
                        </h3>
                        {compareMode === "NONE" ? null : (<div className="flex items-center gap-3">
                            Seprated View <button
                                onClick={() => setIsSeparate(prev => !prev)}
                                className={clsx(
                                    "relative w-12 h-6 rounded-full transition-all duration-300",
                                    isSeparate
                                        ? "bg-emerald-500 ring-2 ring-emerald-400/40"
                                        : "bg-slate-700"
                                )}
                            >
                                <span
                                    className={clsx(
                                        "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300",
                                        isSeparate ? "translate-x-6" : "translate-x-0"
                                    )}
                                />
                            </button>
                        </div>)}
                    </div>
                    <ParticipantTable
                        list={visitedList}
                        attribute={selectedAttributes}
                        setSelectedAttributes={setSelectedAttributes}
                        sortBy={sortBy}
                        setAvailableKeys={setAvailableKeys}
                        emptyMsg="No visits yet."
                    />
                </div>

                {/* -- Right Table: Gap / Comparison -- */}
                {compareMode !== 'NONE' && (
                    <div className="bg-slate-900 border border-white/10 overflow-hidden flex flex-col h-[500px]">
                        <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                            {compareMode === 'TOTAL' ? (<p className="font-bold text-white flex items-center gap-2">
                                <Filter className="w-4 h-4" />
                                Not Visited <span className="underline">{checkpointName}</span> ({gapList.length})
                            </p>) : (<p className="font-bold text-white flex items-center gap-2">
                                <Filter className="w-4 h-4" />
                                Visited <span className="underline">{compareTargetId ? checkpoints.find(c => c.id === compareTargetId)?.name : 'Unknown'}</span> but Missing in <span className="underline">{checkpointName}</span> {" "}
                                ({gapList.length})
                            </p>)}
                        </div>
                        <ParticipantTable
                            list={gapList}
                            attribute={selectedAttributes}
                            setSelectedAttributes={setSelectedAttributes}
                            sortBy={sortBy}
                            setAvailableKeys={setAvailableKeys}
                            emptyMsg="No gap found."
                        />
                    </div>
                )}
            </div>) : (<div className="flex flex-col">
                {/* -- Left Table: Visited -- */}
                <div className="bg-slate-900 border border-white/10 overflow-hidden flex flex-col h-[500px]">
                    <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                        {compareMode === 'TOTAL' ? (<p className="font-bold text-white flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            Visited <span className="underline">{checkpointName}</span> ({lists.visited.length})/Not Visited <span className="underline">{checkpointName}</span> ({lists.gap.length})
                        </p>) : compareMode === 'NONE' ? <p className="font-bold text-white flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Visited {checkpointName} ({lists.visited.length})
                        </p> : (<p className="font-bold text-white flex items-center gap-2">
                            <Users className="w-4 h-4" /> Visited <span className="underline">{checkpointName}</span> ({lists.visited.length})/Not Visited <span className="underline">{checkpointName}</span> but visited in <span className="underline">{compareTargetId ? checkpoints.find(c => c.id === compareTargetId)?.name : 'Unknown'}</span> ({lists.gap.length})
                        </p>)}
                        {compareMode === "NONE" ? null : (<div className="flex items-center gap-3">
                            Seprated View <button
                                onClick={() => setIsSeparate(prev => !prev)}
                                className={clsx(
                                    "relative w-12 h-6 rounded-full transition-all duration-300",
                                    isSeparate
                                        ? "bg-emerald-500 ring-2 ring-emerald-400/40"
                                        : "bg-slate-700"
                                )}
                            >
                                <span
                                    className={clsx(
                                        "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300",
                                        isSeparate ? "translate-x-6" : "translate-x-0"
                                    )}
                                />
                            </button>
                        </div>)}
                    </div>
                    <ParticipantTable
                        list={notSeparatedList}
                        attribute={selectedAttributes}
                        setSelectedAttributes={setSelectedAttributes}
                        sortBy={sortBy}
                        setAvailableKeys={setAvailableKeys}
                        emptyMsg="No visits yet."
                    />
                </div>
            </div>)
            }
        </div >
    );
};

// Reusable Table Component (Internal)
// const ParticipantTable = ({ list, attribute, emptyMsg, setSelectedAttributes, setAvailableKeys }) => {
//     if (list.length === 0) return <div className="p-10 text-center text-slate-500">{emptyMsg}</div>;

//     return (
//         <div className="flex-1 overflow-y-auto custom-scrollbar">
//             <table className="w-full table-auto text-left text-sm text-slate-400">
//                 <thead className="bg-slate-800 text-slate-200 sticky top-0 z-10 shadow-sm">
//                     <tr>
//                         <th className="p-3">Name</th>
//                         <th className="p-3">Email</th>
//                         <th className="p-3">Phone</th>
//                         <th className="p-3">Team name</th>
//                         {attribute.map((attr) => (
//                             <th className="p-3 text-blue-300 whitespace-nowrap">
//                                 <div className="flex items-center gap-2">
//                                     <span>{attr}</span>
//                                     <button
//                                         className="text-slate-500 hover:text-red-400"
//                                         onClick={() => {
//                                             setAvailableKeys(prev => [...prev, attr])
//                                             setSelectedAttributes(prev => prev.filter(i => i !== attr))
//                                         }}
//                                     >
//                                         ✕
//                                     </button>
//                                 </div>
//                             </th>

//                         ))}
//                         <th className="p-3 text-right">Status</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {list.map((p) => {
//                         return (
//                             <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
//                                 <td className="p-3 font-medium text-white max-w-[150px] truncate">{p.name}</td>
//                                 <td className="p-3 text-sm truncate">{p.email}</td>
//                                 <td className="p-3 text-sm truncate">{p.phone}</td>
//                                 <td className="p-3 text-sm truncate">{p.teamName}</td>

//                                 {attribute.map((attr) => (
//                                     <td className="p-3 text-sm truncate">{p[attr]} </td>
//                                 ))}
//                                 <td className="p-3 text-right">
//                                     <span className={clsx(
//                                         "px-2 py-0.5 rounded text-sm font-bold",
//                                         p.status === "INSIDE" ? "bg-emerald-500/10 text-emerald-400" :
//                                             p.status === "EXITED" ? "bg-orange-500/10 text-orange-400" :
//                                                 "bg-slate-800 text-slate-500"
//                                     )}>
//                                         {p.status || "NOT_VISTED"}
//                                     </span>
//                                 </td>
//                             </tr>
//                         );
//                     })}
//                 </tbody>
//             </table>
//         </div>
//     );
// };

// ParticipantTable (complete)
const ParticipantTable = ({
    list,
    attribute = [],
    sortBy = "",
    emptyMsg = "No rows",
    setSelectedAttributes,
    setAvailableKeys
}) => {
    if (!Array.isArray(list) || list.length === 0) {
        return <div className="p-10 text-center text-slate-500">{emptyMsg}</div>;
    }

    // helper to normalize values for grouping comparison
    const norm = (val) => {
        if (val === null || val === undefined) return "";
        if (typeof val === "string") return val.trim().toLowerCase();
        return String(val).toLowerCase();
    };

    // compute how many columns exist (for potential group header row if needed)
    const columnsCount = 4 + attribute.length + 1; // Name, Email, Phone, Team name, ...attrs, Status

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full table-auto text-left text-sm text-slate-400 border-collapse">
                <thead className="bg-slate-800 text-slate-200 sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="p-3">Name</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3">Team name</th>
                        {attribute.map((attr) => (
                            <th key={attr} className="p-3 text-blue-300 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                    <span>{attr}</span>
                                    <button
                                        className="text-slate-500 hover:text-red-400"
                                        onClick={() => {
                                            // restore attr to available keys and remove from selected attributes
                                            if (typeof setAvailableKeys === "function") {
                                                setAvailableKeys(prev => Array.from(new Set([...(prev || []), attr])));
                                            }
                                            if (typeof setSelectedAttributes === "function") {
                                                setSelectedAttributes(prev => (prev || []).filter(i => i !== attr));
                                            }
                                        }}
                                        aria-label={`Remove ${attr}`}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </th>
                        ))}
                        <th className="p-3 text-right">Status</th>
                    </tr>
                </thead>

                <tbody>
                    {list.map((p, index) => {
                        // values used for grouping detection
                        const current = norm(p?.[sortBy]);
                        const prev = norm(list[index - 1]?.[sortBy]);
                        const next = norm(list[index + 1]?.[sortBy]);

                        // only consider grouping when sortBy is truthy
                        const isGroupingActive = !!sortBy;
                        const isGroupStart = isGroupingActive && (index === 0 || current !== prev);
                        const isGroupEnd = isGroupingActive && (index === list.length - 1 || current !== next);

                        // classes:
                        const rowClass = clsx(
                            "transition-colors hover:bg-white/5",
                            // if group start add top border
                            isGroupStart && "border-t-2 border-blue-500/70",
                            // if group end add bottom border (heavier), else thin divider
                            isGroupEnd ? "border-b-2 border-blue-500/70" : "border-b border-white/5"
                        );

                        return (
                            <tr key={p.id || `${index}`} className={rowClass}>
                                <td className="p-3 font-medium text-white max-w-[150px] truncate">{p.name}</td>
                                <td className="p-3 text-sm truncate">{p.email}</td>
                                <td className="p-3 text-sm truncate">{p.phone}</td>
                                <td className="p-3 text-sm truncate">{p.teamName}</td>

                                {attribute.map((attr) => (
                                    <td key={attr} className="p-3 text-sm truncate">{p[attr] ?? "-"}</td>
                                ))}

                                <td className="p-3 text-right">
                                    <span className={clsx(
                                        "px-2 py-0.5 rounded text-sm font-bold",
                                        p.status === "INSIDE" ? "bg-emerald-500/10 text-emerald-400" :
                                            p.status === "EXITED" ? "bg-orange-500/10 text-orange-400" :
                                                "bg-slate-800 text-slate-500"
                                    )}>
                                        {p.status || "NOT_VISITED"}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};


export default CheckpointStats;
